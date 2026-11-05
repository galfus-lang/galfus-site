import { fail, isRedirect } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { validateAndRenewAccessSession } from '$lib/server/access-session';
import { connectDb } from '$lib/server/db';
import { getRequestLocale } from '$lib/server/i18n';
import { temporaryRedirect } from '$lib/server/temporary-redirect';
import {
  AUTH_TRANSACTION_COOKIE_MAX_AGE,
  createAuthTransactionToken,
  MockMessageDelivery,
} from '@galfus/auth-utils';
import { resolveMainAppRedirect } from '@galfus/constants';
import { parseAuthenticationIdentity } from '@galfus/data-manager';
import { startPasswordRecoveryTransaction } from '@galfus/data-manager/server';
import { translate } from '@galfus/i18n';

const messageDelivery = new MockMessageDelivery();

export const load = async ({ cookies, url }) => {
  const session = await validateAndRenewAccessSession(cookies);
  if (session) {
    throw temporaryRedirect(resolveMainAppRedirect(dev, url.searchParams.get('rto')));
  }

  return {};
};

export const actions = {
  default: async ({ request, url, cookies }) => {
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
      const db = await connectDb();
      const transactionToken = await createAuthTransactionToken();
      const expiresAt = new Date(
        Date.now() + AUTH_TRANSACTION_COOKIE_MAX_AGE * 1_000,
      ).toISOString();

      const result = await startPasswordRecoveryTransaction(db, {
        id: transactionToken.id,
        browserVerifierHash: transactionToken.verifierHash,
        identifier: identityResult.output.identifier,
        expiresAt,
      });

      if (result.success && result.data) {
        const resetUrl = `${url.origin}/upsert-password?code=${transactionToken.value}`;
        const recipient = result.data.targetEmail || identityResult.output.identifier;

        await messageDelivery.sendEmail({
          to: recipient,
          subject: 'Reset your Galfus password',
          text: `You requested a password reset. Open the following link to set a new password: ${resetUrl}`,
        });

        if (dev) {
          console.info(`[PASSWORD RECOVERY] Reset link for ${recipient}: ${resetUrl}`);
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
