import { fail, isRedirect } from '@sveltejs/kit';
import { generateId, generateOtp, hashSecret } from '@galfus/auth-utils';
import { clearAuthTransactionCookie, setAuthAccessTokenCookie } from '$lib/server/auth-cookies';
import { requireAuthTransaction } from '$lib/server/auth-transaction';
import { connectDb } from '$lib/server/db';
import { getRequestLocale } from '$lib/server/i18n';
import { getPrimaryCredentialVersion, issueAccessToken } from '$lib/server/access-session';
import { messageDelivery } from '$lib/server/messaging';
import { temporaryRedirect } from '$lib/server/temporary-redirect';
import {
  completeAuthTransaction,
  confirmOtpAuthTransaction,
  createOtpChallenge,
  getActiveMfaAuthenticator,
} from '@galfus/data-manager/server';
import { translate } from '@galfus/i18n';

function extractAccountId(account: unknown): string {
  if (!account) return '';
  if (typeof account === 'string') return account;
  if (typeof account === 'object' && 'id' in account) {
    return (account as { toString(): string }).toString();
  }
  return String(account);
}

function maskRecipient(value: string): string {
  const [local, domain] = value.split('@');
  if (domain && local) return `${local.slice(0, 2)}***@${domain}`;
  return `${value.slice(0, 3)}***`;
}

export const load = async ({ cookies }) => {
  const { token, transaction } = await requireAuthTransaction(cookies, {
    allowedKinds: ['authorization'],
    allowedStatuses: ['awaiting_mfa'],
  });

  const pendingMethod = transaction.metadata?.authorization?.pending_mfa_method;
  if (pendingMethod === 'totp') {
    throw temporaryRedirect('/mfa-otp');
  }

  const accountId = extractAccountId(transaction.account);
  const identifier = transaction.metadata?.authorization?.identifier ?? '';
  const channel = pendingMethod === 'sms_otp' ? 'sms' : 'email';

  try {
    const db = await connectDb();

    // Check if an unexpired challenge already exists for this transaction
    const [existingChallenges] = await db
      .query<[Array<{ id: unknown }>]>(
        `
          SELECT id FROM auth_otp_challenge
          WHERE transaction = type::record('auth_transaction', $transactionId)
            AND purpose = 'mfa'
            AND consumed_at IS NONE
            AND expires_at > time::now()
          LIMIT 1;
        `,
        { transactionId: token.id },
      )
      .json();

    if (!existingChallenges?.[0]) {
      // Find the active authenticator
      const authResult = await getActiveMfaAuthenticator(db, {
        accountId,
        kind: pendingMethod === 'sms_otp' ? 'sms_otp' : 'email_otp',
      });

      const authenticatorId =
        authResult.success && authResult.data ? authResult.data.id : undefined;
      const code = generateOtp(6);
      const codeHash = await hashSecret(code);
      const expiresAt = new Date(Date.now() + 10 * 60 * 1_000).toISOString();

      await createOtpChallenge(db, {
        id: generateId(),
        purpose: 'mfa',
        codeHash,
        expiresAt,
        maxAttempts: 5,
        accountId,
        transactionId: token.id,
        ...(authenticatorId ? { authenticatorId } : {}),
      });

      if (channel === 'email' && identifier) {
        await messageDelivery.sendEmail({
          to: identifier,
          subject: 'Galfus Verification Code',
          text: `Your Galfus verification code is ${code}. It expires in 10 minutes.`,
        });
      } else if (channel === 'sms' && identifier) {
        await messageDelivery.sendSms({
          to: identifier,
          text: `Your Galfus verification code is ${code}.`,
        });
      }
    }

    return {
      destination: maskRecipient(identifier || 'device'),
      channel,
    };
  } catch (error) {
    if (isRedirect(error)) throw error;
    console.error('MFA-pass load error:', error);
    return {
      destination: maskRecipient(identifier || 'device'),
      channel,
    };
  }
};

export const actions = {
  verify: async ({ request, cookies }) => {
    const locale = getRequestLocale({ request, cookies });
    const data = await request.formData();
    const otp = data.get('otp')?.toString()?.trim() ?? '';

    if (!/^\d{6}$/.test(otp)) {
      return fail(400, { error: translate('error.auth.otp.invalid', locale) });
    }

    const { token, transaction } = await requireAuthTransaction(cookies, {
      allowedKinds: ['authorization'],
      allowedStatuses: ['awaiting_mfa'],
    });

    const accountId = extractAccountId(transaction.account);
    const identifier = transaction.metadata?.authorization?.identifier ?? '';
    const pendingMethod = transaction.metadata?.authorization?.pending_mfa_method;

    try {
      const db = await connectDb();

      // Find the active challenge for this transaction
      const [challenges] = await db
        .query<[Array<{ id: unknown }>]>(
          `
            SELECT id FROM auth_otp_challenge
            WHERE transaction = type::record('auth_transaction', $transactionId)
              AND purpose = 'mfa'
              AND consumed_at IS NONE
              AND expires_at > time::now()
            ORDER BY created_at DESC
            LIMIT 1;
          `,
          { transactionId: token.id },
        )
        .json();

      const challengeCandidate = challenges?.[0];
      if (!challengeCandidate) {
        return fail(400, { error: translate('error.auth.otp.invalid', locale) });
      }

      const rawId = challengeCandidate.id;
      const challengeId =
        typeof rawId === 'object' && rawId !== null && 'id' in rawId
          ? String((rawId as { id: unknown }).id)
          : String(rawId);

      // Find authenticator
      const authResult = await getActiveMfaAuthenticator(db, {
        accountId,
        kind: pendingMethod === 'sms_otp' ? 'sms_otp' : 'email_otp',
      });

      if (!authResult.success || !authResult.data) {
        return fail(400, { error: translate('error.auth.otp.invalid', locale) });
      }

      const codeHash = await hashSecret(otp);

      const confirmResult = await confirmOtpAuthTransaction(db, {
        id: token.id,
        browserVerifierHash: token.verifierHash,
        expectedVersion: transaction.version,
        accountId,
        authenticatorId: authResult.data.id,
        otpChallengeId: challengeId,
        codeHash,
      });

      if (!confirmResult.success) {
        return fail(401, { error: translate('error.auth.otp.incorrect', locale) });
      }

      const credentialVersion = getPrimaryCredentialVersion(transaction);
      const completeResult = await completeAuthTransaction(db, {
        id: token.id,
        browserVerifierHash: token.verifierHash,
        expectedVersion: confirmResult.data.version,
        accountId,
      });

      if (!completeResult.success) {
        clearAuthTransactionCookie(cookies);
        throw temporaryRedirect('/');
      }

      const accessToken = await issueAccessToken(
        db,
        {
          accountId,
          identifier,
          ...(completeResult.data.return_to ? { rto: completeResult.data.return_to } : {}),
        },
        credentialVersion,
      );

      setAuthAccessTokenCookie(cookies, accessToken);
      clearAuthTransactionCookie(cookies);

      throw temporaryRedirect('/success');
    } catch (error) {
      if (isRedirect(error)) throw error;

      console.error('MFA OTP validation error:', error);
      return fail(500, { error: translate('error.auth.login.failed', locale) });
    }
  },

  resend: async ({ cookies }) => {
    const { token, transaction } = await requireAuthTransaction(cookies, {
      allowedKinds: ['authorization'],
      allowedStatuses: ['awaiting_mfa'],
    });

    const accountId = extractAccountId(transaction.account);
    const identifier = transaction.metadata?.authorization?.identifier ?? '';
    const pendingMethod = transaction.metadata?.authorization?.pending_mfa_method;
    const channel = pendingMethod === 'sms_otp' ? 'sms' : 'email';

    try {
      const db = await connectDb();

      const authResult = await getActiveMfaAuthenticator(db, {
        accountId,
        kind: pendingMethod === 'sms_otp' ? 'sms_otp' : 'email_otp',
      });

      const authenticatorId =
        authResult.success && authResult.data ? authResult.data.id : undefined;
      const code = generateOtp(6);
      const codeHash = await hashSecret(code);
      const expiresAt = new Date(Date.now() + 10 * 60 * 1_000).toISOString();

      await createOtpChallenge(db, {
        id: generateId(),
        purpose: 'mfa',
        codeHash,
        expiresAt,
        maxAttempts: 5,
        accountId,
        transactionId: token.id,
        ...(authenticatorId ? { authenticatorId } : {}),
      });

      if (channel === 'email' && identifier) {
        await messageDelivery.sendEmail({
          to: identifier,
          subject: 'Galfus Verification Code',
          text: `Your new Galfus verification code is ${code}. It expires in 10 minutes.`,
        });
      } else if (channel === 'sms' && identifier) {
        await messageDelivery.sendSms({
          to: identifier,
          text: `Your new Galfus verification code is ${code}.`,
        });
      }

      return { success: true };
    } catch (error) {
      if (isRedirect(error)) throw error;
      console.error('Failed to resend code:', error);
      return fail(500);
    }
  },
};
