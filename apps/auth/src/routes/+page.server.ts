import { fail, isRedirect } from '@sveltejs/kit';
import { dev } from '$app/environment';
import {
  AUTH_TRANSACTION_COOKIE_MAX_AGE,
  createAuthTransactionToken,
  hashSecret,
  parseAuthTransactionToken,
} from '@galfus/auth-utils';
import { getValidatedMainAppRedirect, resolveMainAppRedirect } from '@galfus/constants';
import { messageIdFromIssues, parseAuthenticationIdentity } from '@galfus/data-manager';
import { getAuthTransaction, startIdentityAuthTransaction } from '@galfus/data-manager/server';
import { translate } from '@galfus/i18n';
import {
  clearAuthTransactionCookie,
  getAuthTransactionCookie,
  setAuthTransactionCookie,
} from '$lib/server/auth-cookies';
import { connectDb } from '$lib/server/db';
import { getRequestLocale } from '$lib/server/i18n';
import { validateAndRenewAccessSession } from '$lib/server/access-session';
import { temporaryRedirect } from '$lib/server/temporary-redirect';
import { sendRegistrationCode } from '$lib/server/registration-email';

function transactionRoute(
  kind: string,
  status: string,
  method?: string,
): '/challenge' | '/register' | '/mfa-otp' | null {
  if (kind === 'authorization' && status === 'awaiting_mfa' && method === 'totp') return '/mfa-otp';
  if (status !== 'awaiting_primary') return null;
  if (kind === 'authorization') return '/challenge';
  if (kind === 'registration') return '/register';
  return null;
}

export const load = async ({ cookies, url }) => {
  if (url.searchParams.get('restart') === '1') {
    clearAuthTransactionCookie(cookies);
  }
  const session = await validateAndRenewAccessSession(cookies);
  if (session) {
    throw temporaryRedirect(resolveMainAppRedirect(dev, url.searchParams.get('rto')));
  }

  const cookie = getAuthTransactionCookie(cookies);
  if (!cookie)
    return {
      passwordReset: url.searchParams.get('password_reset') === '1',
      ...(url.searchParams.get('auth_error') === '1'
        ? { transactionError: 'error.auth.transaction.invalid' as const }
        : {}),
    };

  const token = parseAuthTransactionToken(cookie);
  if (!token) {
    clearAuthTransactionCookie(cookies);
    return { transactionError: 'error.auth.transaction.invalid' as const };
  }

  const db = await connectDb();
  const result = await getAuthTransaction(db, {
    id: token.id,
    browserVerifierHash: await hashSecret(token.verifier),
  });
  if (!result.success) {
    clearAuthTransactionCookie(cookies);
    return { transactionError: result.error.id };
  }

  const nextRoute = transactionRoute(
    result.data.kind,
    result.data.status,
    result.data.kind === 'authorization'
      ? result.data.metadata?.authorization?.pending_mfa_method
      : undefined,
  );
  if (nextRoute) throw temporaryRedirect(nextRoute);

  clearAuthTransactionCookie(cookies);
  return { transactionError: 'error.auth.transaction.invalid' as const };
};

export const actions = {
  default: async ({ request, url, cookies }) => {
    const locale = getRequestLocale({ request, cookies });
    const data = await request.formData();
    const returnTo = getValidatedMainAppRedirect(dev, url.searchParams.get('rto'));
    const identifierInput = data.get('identifier');
    const rawIdentifier = typeof identifierInput === 'string' ? identifierInput : '';
    const identityResult = parseAuthenticationIdentity(rawIdentifier);

    if (!identityResult.success) {
      return fail(400, {
        error: translate(messageIdFromIssues(identityResult.issues), locale),
        identifier: rawIdentifier.trim(),
      });
    }

    try {
      const db = await connectDb();
      const transactionToken = await createAuthTransactionToken();
      const transactionResult = await startIdentityAuthTransaction(db, {
        id: transactionToken.id,
        browserVerifierHash: transactionToken.verifierHash,
        identifier: identityResult.output.identifier,
        expiresAt: new Date(Date.now() + AUTH_TRANSACTION_COOKIE_MAX_AGE * 1_000).toISOString(),
        returnTo,
      });
      if (!transactionResult.success) {
        return fail(transactionResult.error.id === 'error.auth.account.blocked' ? 403 : 400, {
          error: translate(transactionResult.error.id, locale),
          identifier: identityResult.output.identifier,
        });
      }

      if (
        transactionResult.data.nextRoute === '/register' &&
        identityResult.output.provider !== 'email'
      ) {
        return fail(400, {
          error: translate('error.auth.registration.email_required', locale),
          identifier: identityResult.output.identifier,
        });
      }

      setAuthTransactionCookie(cookies, transactionToken.value);
      if (transactionResult.data.nextRoute === '/register') {
        try {
          const sent = await sendRegistrationCode(db, transactionToken, locale);
          if (!sent.success) throw temporaryRedirect('/register?delivery=limited');
        } catch (error) {
          if (isRedirect(error)) throw error;
          console.error('Registration email delivery failed.');
          throw temporaryRedirect('/register?delivery=failed');
        }
      }
      throw temporaryRedirect(transactionResult.data.nextRoute);
    } catch (error) {
      if (isRedirect(error)) throw error;
      console.error('Identity validation error:', error);
      return fail(500, {
        error: translate('error.auth.identity.lookup_failed', locale),
        identifier: identityResult.output.identifier,
      });
    }
  },
};
