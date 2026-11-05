import { fail, isRedirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { hashOtp } from '@galfus/auth-utils';
import { messageIdFromIssues, parseRegistrationCredentials } from '@galfus/data-manager';
import { completeVerifiedRegistration } from '@galfus/data-manager/server';
import { translate } from '@galfus/i18n';
import { clearAuthTransactionCookie, setAuthAccessTokenCookie } from '$lib/server/auth-cookies';
import { requireAuthTransaction } from '$lib/server/auth-transaction';
import { connectDb } from '$lib/server/db';
import { getRequestLocale } from '$lib/server/i18n';
import { issueAccessToken } from '$lib/server/access-session';
import { sendRegistrationCode } from '$lib/server/registration-email';
import { temporaryRedirect } from '$lib/server/temporary-redirect';

export const load = async ({ cookies, url }) => {
  const { transaction } = await requireAuthTransaction(cookies, {
    allowedKinds: ['registration'],
    allowedStatuses: ['awaiting_primary'],
  });
  if (transaction.metadata?.registration?.provider !== 'email') {
    clearAuthTransactionCookie(cookies);
    throw temporaryRedirect('/');
  }
  return {
    identifier: transaction.metadata.registration.identifier ?? '',
    delivery: url.searchParams.get('delivery'),
  };
};

export const actions = {
  register: async ({ request, cookies }) => {
    const locale = getRequestLocale({ request, cookies });
    const data = await request.formData();
    const fullName = String(data.get('fullName') ?? '');
    const password = String(data.get('password') ?? '');
    const confirmPassword = String(data.get('confirmPassword') ?? '');
    const code = String(data.get('code') ?? '').trim();
    const credentials = parseRegistrationCredentials({ fullName, password, confirmPassword });
    if (!credentials.success) {
      return fail(400, {
        error: translate(messageIdFromIssues(credentials.issues), locale),
        fullName: fullName.trim(),
      });
    }
    if (!/^\d{6}$/.test(code)) {
      return fail(400, {
        error: translate('error.auth.otp.invalid', locale),
        fullName: fullName.trim(),
      });
    }
    const { token, transaction } = await requireAuthTransaction(cookies, {
      allowedKinds: ['registration'],
      allowedStatuses: ['awaiting_primary'],
    });
    try {
      const pepper = env.AUTH_OTP_SECRET;
      if (!pepper || pepper.length < 32)
        throw new Error('Registration verification is not configured.');
      const db = await connectDb();
      const result = await completeVerifiedRegistration(db, {
        id: token.id,
        browserVerifierHash: token.verifierHash,
        codeHash: await hashOtp(code, pepper),
        ...credentials.output,
      });
      if (!result.success) {
        return fail(400, { error: translate(result.error.id, locale), fullName: fullName.trim() });
      }
      const accessToken = await issueAccessToken(
        db,
        {
          accountId: result.data.accountId,
          identifier: transaction.metadata?.registration?.identifier,
          ...(result.data.returnTo ? { rto: result.data.returnTo } : {}),
        },
        0,
      );
      setAuthAccessTokenCookie(cookies, accessToken);
      clearAuthTransactionCookie(cookies);
      throw temporaryRedirect('/success');
    } catch (error) {
      if (isRedirect(error)) throw error;
      console.error('Registration failed.');
      return fail(500, {
        error: translate('error.auth.registration.failed', locale),
        fullName: fullName.trim(),
      });
    }
  },
  resend: async ({ request, cookies }) => {
    const locale = getRequestLocale({ request, cookies });
    const { token } = await requireAuthTransaction(cookies, {
      allowedKinds: ['registration'],
      allowedStatuses: ['awaiting_primary'],
    });
    try {
      const result = await sendRegistrationCode(await connectDb(), token, locale);
      if (!result.success) return fail(429, { error: translate(result.error.id, locale) });
      return { sent: true };
    } catch (error) {
      if (isRedirect(error)) throw error;
      console.error('Registration email delivery failed.');
      return fail(503, { error: translate('error.auth.registration.delivery_failed', locale) });
    }
  },
};
