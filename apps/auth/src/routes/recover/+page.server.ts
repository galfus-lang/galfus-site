import { fail, isRedirect } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import { validateAndRenewAccessSession } from '$lib/server/access-session';
import { connectDb } from '$lib/server/db';
import { getRequestLocale } from '$lib/server/i18n';
import { temporaryRedirect } from '$lib/server/temporary-redirect';
import {
  AUTH_TRANSACTION_COOKIE_MAX_AGE,
  createAuthTransactionToken,
  hashSecret,
} from '@galfus/auth-utils';
import { APP_URLS, getValidatedMainAppRedirect, resolveMainAppRedirect } from '@galfus/constants';
import { createEmailSender, renderPasswordRecoveryEmail } from '@galfus/email-utils';
import { parseAuthenticationIdentity } from '@galfus/data-manager';
import {
  reservePasswordAttempt,
  startPasswordRecoveryTransaction,
} from '@galfus/data-manager/server';
import { translate } from '@galfus/i18n';

export const load = async ({ cookies, url }) => {
  const session = await validateAndRenewAccessSession(cookies);
  if (session) {
    throw temporaryRedirect(resolveMainAppRedirect(dev, url.searchParams.get('rto')));
  }

  return {};
};

export const actions = {
  default: async ({ request, url, cookies, getClientAddress }) => {
    const locale = getRequestLocale({ request, cookies });
    const data = await request.formData();
    const identifierInput = data.get('identifier');
    const rawIdentifier = typeof identifierInput === 'string' ? identifierInput : '';
    const identityResult = parseAuthenticationIdentity(rawIdentifier);

    if (!identityResult.success) {
      return fail(400, {
        error: translate('error.input.invalid', locale),
        identifier: rawIdentifier.trim(),
      });
    }

    try {
      if (!env.RESEND_API_KEY || !env.RESEND_FROM)
        throw new Error('Password recovery delivery is not configured.');
      const db = await connectDb();
      const pepper = env.AUTH_RATE_LIMIT_SECRET;
      if (!pepper || pepper.length < 32) throw new Error('AUTH_RATE_LIMIT_SECRET is required.');
      const limit = await reservePasswordAttempt(db, {
        scope: 'recovery',
        accountHash: await hashSecret(`${pepper}:recovery:${identityResult.output.identifier}`),
        addressHash: await hashSecret(`${pepper}:address:${getClientAddress()}`),
      });
      if (!limit.success || !limit.data) return { success: true, identifier: rawIdentifier.trim() };
      const transactionToken = await createAuthTransactionToken();
      const expiresAt = new Date(
        Date.now() + AUTH_TRANSACTION_COOKIE_MAX_AGE * 1_000,
      ).toISOString();

      const result = await startPasswordRecoveryTransaction(db, {
        id: transactionToken.id,
        browserVerifierHash: transactionToken.verifierHash,
        identifier: identityResult.output.identifier,
        expiresAt,
        returnTo: getValidatedMainAppRedirect(dev, url.searchParams.get('rto')),
      });

      if (result.success && result.data) {
        try {
          if (!result.data.targetEmail) throw new Error('Missing verified recovery address.');
          const resetUrl = new URL(
            '/upsert-password',
            dev ? APP_URLS.dev.auth : APP_URLS.prod.auth,
          );
          resetUrl.searchParams.set('code', transactionToken.value);
          const email = await renderPasswordRecoveryEmail({
            url: resetUrl.toString(),
            expiresInMinutes: 15,
            locale,
          });
          await createEmailSender({ apiKey: env.RESEND_API_KEY, from: env.RESEND_FROM }).send({
            to: result.data.targetEmail,
            ...email,
            idempotencyKey: `recovery/${transactionToken.id}`,
          });
        } catch {
          console.error('Password recovery email delivery failed.');
        }
      }

      return {
        success: true,
        identifier: rawIdentifier.trim(),
      };
    } catch (error) {
      if (isRedirect(error)) throw error;
      console.error('Password recovery error:', error);
      return fail(500, {
        error: translate('error.auth.login.failed', locale),
        identifier: rawIdentifier.trim(),
      });
    }
  },
};
