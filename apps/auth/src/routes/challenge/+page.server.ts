import { fail, isRedirect } from '@sveltejs/kit';
import { reserveLoginAttempt } from '$lib/server/password-attempt';
import { clearAuthTransactionCookie, setAuthAccessTokenCookie } from '$lib/server/auth-cookies';
import { requireAuthTransaction } from '$lib/server/auth-transaction';
import { connectDb } from '$lib/server/db';
import { getRequestLocale } from '$lib/server/i18n';
import { getPrimaryCredentialVersion, issueAccessToken } from '$lib/server/access-session';
import { getPasskeyRelyingParty } from '$lib/server/passkey';
import { temporaryRedirect } from '$lib/server/temporary-redirect';
import {
  createPasskeyAuthenticationOptions,
  verifyPasskeyAuthentication,
  type AuthenticationResponseJSON,
} from '@galfus/auth-utils';
import {
  authorizePasskeyAuthTransaction,
  completeAuthTransaction,
  confirmPasswordAuthTransaction,
  getAccountAuthenticationState,
  getAccountPasskeys,
  setPasskeyAuthTransactionChallenge,
  type AuthTransactionView,
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
    allowedStatuses: ['awaiting_primary'],
  });

  const accountId = extractAccountId(transaction.account);
  const identifier = transaction.metadata?.authorization?.identifier ?? '';

  try {
    const db = await connectDb();
    const authenticationStateResult = await getAccountAuthenticationState(db, { accountId });
    const hasPasskey = authenticationStateResult.success
      ? Boolean(authenticationStateResult.data?.hasPasskey)
      : false;

    return {
      identifier,
      hasPasskey,
      ...(transaction.return_to ? { returnTo: transaction.return_to } : {}),
    };
  } catch (error) {
    if (isRedirect(error)) throw error;
    console.error('Failed to load authentication state for challenge:', error);
    return {
      identifier,
      hasPasskey: false,
      ...(transaction.return_to ? { returnTo: transaction.return_to } : {}),
    };
  }
};

export const actions = {
  password: async ({ request, cookies, getClientAddress }) => {
    const locale = getRequestLocale({ request, cookies });
    const data = await request.formData();
    const password = data.get('password')?.toString();

    if (!password) {
      return fail(400, { error: translate('error.auth.pass.required', locale) });
    }

    const { token, transaction } = await requireAuthTransaction(cookies, {
      allowedKinds: ['authorization'],
      allowedStatuses: ['awaiting_primary'],
    });

    const accountId = extractAccountId(transaction.account);
    const identifier = transaction.metadata?.authorization?.identifier ?? '';

    try {
      const db = await connectDb();
      if (!(await reserveLoginAttempt(db, accountId, getClientAddress())))
        return fail(429, { error: translate('error.auth.login.rate_limited', locale) });

      const confirmResult = await confirmPasswordAuthTransaction(db, {
        id: token.id,
        browserVerifierHash: token.verifierHash,
        expectedVersion: transaction.version,
        accountId,
        password,
      });

      if (!confirmResult.success) {
        return fail(401, { error: translate('error.auth.pass.incorrect', locale) });
      }

      const confirmedTx = confirmResult.data as AuthTransactionView<'authorization'>;
      const credentialVersion = getPrimaryCredentialVersion(confirmedTx);

      // Handle MFA requirement
      if (confirmedTx.status === 'awaiting_mfa') {
        const pendingMfaMethod = confirmedTx.metadata?.authorization?.pending_mfa_method;
        if (pendingMfaMethod === 'totp') {
          throw temporaryRedirect('/mfa-otp');
        }
        return fail(403, { error: translate('error.auth.login.failed', locale) });
      }

      if (confirmedTx.status !== 'authorized') {
        clearAuthTransactionCookie(cookies);
        throw temporaryRedirect('/');
      }

      // Complete the authorized transaction
      const completeResult = await completeAuthTransaction(db, {
        id: token.id,
        browserVerifierHash: token.verifierHash,
        expectedVersion: confirmedTx.version,
        accountId,
      });

      if (!completeResult.success) {
        clearAuthTransactionCookie(cookies);
        throw temporaryRedirect('/');
      }

      // Issue global stateless access token
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

      console.error('Challenge error:', error);
      return fail(500, { error: translate('error.auth.login.failed', locale) });
    }
  },

  passkeyOptions: async ({ request, cookies }) => {
    const { token, transaction } = await requireAuthTransaction(cookies, {
      allowedKinds: ['authorization'],
      allowedStatuses: ['awaiting_primary'],
    });

    const accountId = extractAccountId(transaction.account);

    try {
      const db = await connectDb();
      const passkeys = await getAccountPasskeys(db, accountId);

      const origin = request.headers.get('origin');
      const relyingParty = getPasskeyRelyingParty(origin);

      const options = await createPasskeyAuthenticationOptions({
        relyingParty,
        passkeys: passkeys.map((p) => ({
          credentialId: p.credentialId,
          transports: p.transports,
        })),
      });

      // Save challenge in transaction
      const challengeResult = await setPasskeyAuthTransactionChallenge(db, {
        id: token.id,
        browserVerifierHash: token.verifierHash,
        expectedVersion: transaction.version,
        accountId,
        challengeCiphertext: options.challenge,
      });

      if (!challengeResult.success) {
        return fail(400);
      }

      return { options };
    } catch (error) {
      if (isRedirect(error)) throw error;
      console.error('Passkey options error:', error);
      return fail(500);
    }
  },

  passkeyVerify: async ({ request, cookies }) => {
    const locale = getRequestLocale({ request, cookies });
    const { token, transaction } = await requireAuthTransaction(cookies, {
      allowedKinds: ['authorization'],
      allowedStatuses: ['awaiting_primary'],
    });

    const accountId = extractAccountId(transaction.account);
    const identifier = transaction.metadata?.authorization?.identifier ?? '';

    try {
      const form = await request.formData();
      const response = JSON.parse(String(form.get('response') ?? 'null')) as
        AuthenticationResponseJSON | undefined;

      if (!response?.id) {
        return fail(400, { error: translate('error.input.invalid', locale) });
      }

      const expectedChallenge = transaction.metadata?.authorization?.passkey?.challenge_ciphertext;
      if (!expectedChallenge) {
        return fail(400, { error: translate('error.auth.transaction.invalid', locale) });
      }

      const db = await connectDb();
      const passkeys = await getAccountPasskeys(db, accountId);
      const matchedPasskey = passkeys.find((p) => p.credentialId === response.id);

      if (!matchedPasskey) {
        return fail(400, { error: translate('error.auth.identity.invalid', locale) });
      }

      const origin = request.headers.get('origin');
      const relyingParty = getPasskeyRelyingParty(origin);

      const verification = await verifyPasskeyAuthentication({
        relyingParty,
        expectedChallenge,
        response,
        passkey: matchedPasskey,
      });

      if (!verification.verified) {
        return fail(401, { error: translate('error.auth.login.failed', locale) });
      }

      const authorizeResult = await authorizePasskeyAuthTransaction(db, {
        id: token.id,
        browserVerifierHash: token.verifierHash,
        expectedVersion: transaction.version,
        accountId,
        authenticatorId: matchedPasskey.id,
        newCounter: verification.newCounter,
      });

      if (!authorizeResult.success) {
        return fail(400, { error: translate('error.auth.transaction.state_conflict', locale) });
      }

      const authorizedTx = authorizeResult.data;
      const credentialVersion = getPrimaryCredentialVersion(authorizedTx);

      if (authorizedTx.status === 'awaiting_mfa') {
        const pendingMfa = authorizedTx.metadata?.authorization?.pending_mfa_method;
        if (pendingMfa !== 'totp')
          return fail(403, { error: translate('error.auth.login.failed', locale) });
        return { redirectUrl: '/mfa-otp' };
      }

      const completeResult = await completeAuthTransaction(db, {
        id: token.id,
        browserVerifierHash: token.verifierHash,
        expectedVersion: authorizedTx.version,
        accountId,
      });

      if (!completeResult.success) {
        clearAuthTransactionCookie(cookies);
        return { redirectUrl: '/' };
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

      return { redirectUrl: '/success' };
    } catch (error) {
      if (isRedirect(error)) throw error;
      console.error('Passkey verification error:', error);
      return fail(500, { error: translate('error.auth.login.failed', locale) });
    }
  },
};
