import { fail, isRedirect } from '@sveltejs/kit';
import { hashRecoveryCode, verifyTotpStep } from '@galfus/auth-utils';
import { decryptTotpSecret, recoveryPepper } from '$lib/server/totp-secrets';
import { reserveLoginAttempt } from '$lib/server/password-attempt';
import { clearAuthTransactionCookie, setAuthAccessTokenCookie } from '$lib/server/auth-cookies';
import { requireAuthTransaction } from '$lib/server/auth-transaction';
import { connectDb } from '$lib/server/db';
import { getRequestLocale } from '$lib/server/i18n';
import { getPrimaryCredentialVersion, issueAccessToken } from '$lib/server/access-session';
import { temporaryRedirect } from '$lib/server/temporary-redirect';
import {
  completeAuthTransaction,
  confirmRecoveryCodeAuthTransaction,
  confirmTotpAuthTransaction,
  getActiveMfaAuthenticator,
  recordMfaFailure,
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

export const load = async ({ cookies }) => {
  const { transaction } = await requireAuthTransaction(cookies, {
    allowedKinds: ['authorization'],
    allowedStatuses: ['awaiting_mfa'],
  });

  const pendingMethod = transaction.metadata?.authorization?.pending_mfa_method;
  if (pendingMethod !== 'totp') {
    clearAuthTransactionCookie(cookies);
    throw temporaryRedirect('/');
  }

  const identifier = transaction.metadata?.authorization?.identifier ?? '';

  return {
    identifier,
  };
};

export const actions = {
  verify: async ({ request, cookies, getClientAddress }) => {
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

    try {
      const db = await connectDb();
      if (!(await reserveLoginAttempt(db, accountId, getClientAddress(), 'mfa')))
        return fail(429, { error: translate('error.auth.login.rate_limited', locale) });

      // 1. Locate active TOTP authenticator
      const authenticatorResult = await getActiveMfaAuthenticator(db, {
        accountId,
        kind: 'totp',
      });

      if (!authenticatorResult.success || !authenticatorResult.data) {
        return fail(400, { error: translate('error.auth.otp.invalid', locale) });
      }

      const authenticator = authenticatorResult.data;
      if (!authenticator.secretCiphertext) {
        return fail(400, { error: translate('error.auth.otp.invalid', locale) });
      }
      const secret = await decryptTotpSecret(authenticator.secretCiphertext);
      const step = verifyTotpStep(otp, {
        issuer: 'Galfus',
        label: identifier || 'Galfus User',
        secret,
        period: 30,
        digits: 6,
      });
      if (step === null) {
        await recordMfaFailure(db, {
          id: token.id,
          browserVerifierHash: token.verifierHash,
          accountId,
        });
        return fail(401, { error: translate('error.auth.otp.incorrect', locale) });
      }

      // 3. Atomically confirm transaction
      const confirmResult = await confirmTotpAuthTransaction(db, {
        id: token.id,
        browserVerifierHash: token.verifierHash,
        expectedVersion: transaction.version,
        accountId,
        authenticatorId: authenticator.id,
        step,
      });

      if (!confirmResult.success) {
        return fail(400, { error: translate('error.auth.otp.invalid', locale) });
      }

      const credentialVersion = getPrimaryCredentialVersion(transaction);

      // 4. Complete transaction and issue access token
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

      console.error('MFA TOTP validation error:', error);
      return fail(500, { error: translate('error.auth.login.failed', locale) });
    }
  },

  recovery: async ({ request, cookies, getClientAddress }) => {
    const locale = getRequestLocale({ request, cookies });
    const data = await request.formData();
    const recoveryCode = data.get('recoveryCode')?.toString()?.trim() ?? '';

    if (!recoveryCode) {
      return fail(400, { error: translate('error.auth.otp.invalid', locale) });
    }

    const { token, transaction } = await requireAuthTransaction(cookies, {
      allowedKinds: ['authorization'],
      allowedStatuses: ['awaiting_mfa'],
    });

    const accountId = extractAccountId(transaction.account);
    const identifier = transaction.metadata?.authorization?.identifier ?? '';

    try {
      const db = await connectDb();
      if (!(await reserveLoginAttempt(db, accountId, getClientAddress(), 'mfa')))
        return fail(429, { error: translate('error.auth.login.rate_limited', locale) });
      let codeHash: string;
      try {
        codeHash = await hashRecoveryCode(recoveryCode, recoveryPepper());
      } catch {
        await recordMfaFailure(db, {
          id: token.id,
          browserVerifierHash: token.verifierHash,
          accountId,
        });
        return fail(401, { error: translate('error.auth.otp.incorrect', locale) });
      }

      const confirmResult = await confirmRecoveryCodeAuthTransaction(db, {
        id: token.id,
        browserVerifierHash: token.verifierHash,
        expectedVersion: transaction.version,
        accountId,
        codeHash,
      });

      if (!confirmResult.success) {
        await recordMfaFailure(db, {
          id: token.id,
          browserVerifierHash: token.verifierHash,
          accountId,
        });
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

      console.error('MFA recovery code error:', error);
      return fail(500, { error: translate('error.auth.login.failed', locale) });
    }
  },
};
