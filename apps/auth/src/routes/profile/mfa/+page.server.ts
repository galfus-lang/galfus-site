import { fail, isRedirect } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { connectDb } from '$lib/server/db';
import { getRequestLocale } from '$lib/server/i18n';
import { requireUserSession } from '$lib/server/user-session';
import { issueAccessToken } from '$lib/server/access-session';
import { setAuthAccessTokenCookie } from '$lib/server/auth-cookies';
import { decryptTotpSecret, encryptTotpSecret, recoveryPepper } from '$lib/server/totp-secrets';
import { reserveLoginAttempt } from '$lib/server/password-attempt';
import {
  createQrCodeSvg,
  createTotpEnrollment,
  generateId,
  generateRecoveryCodes,
  hashRecoveryCode,
  verifyTotpStep,
} from '@galfus/auth-utils';
import {
  activateDirectTotpAuthenticator,
  disableAccountMfa,
  getActiveMfaAuthenticator,
  getAccountProfile,
  verifyAccountPassword,
} from '@galfus/data-manager/server';
import { translate } from '@galfus/i18n';

import { load as loadProfile } from '../+page.server';

export const load: typeof loadProfile = async (event) => {
  event.setHeaders({ 'cache-control': 'no-store' });
  return loadProfile(event);
};

export const actions = {
  setupTotp: async ({ request, cookies, getClientAddress }) => {
    const locale = getRequestLocale({ request, cookies });
    const session = await requireUserSession(cookies);

    try {
      const form = await request.formData();
      const password = String(form.get('currentPassword') ?? '');
      const db = await connectDb();
      const profile = await getAccountProfile(db, { accountId: session.accountId });
      if (!(await reserveLoginAttempt(db, session.accountId, getClientAddress())))
        return fail(429, { error: translate('error.auth.login.rate_limited', locale) });
      const verified =
        password &&
        password.length <= 128 &&
        (await verifyAccountPassword(db, { accountId: session.accountId, password }));
      if (
        !profile.success ||
        !profile.data ||
        profile.data.security.mfa.enabled ||
        !verified ||
        !verified.success ||
        !verified.data
      ) {
        return fail(401, { error: translate('error.auth.pass.incorrect', locale) });
      }
      const enrollment = createTotpEnrollment({
        issuer: 'Galfus',
        label: session.identifier || 'user',
      });

      const qrCodeSvg = await createQrCodeSvg(enrollment.uri);
      const recoveryCodes = generateRecoveryCodes(10);

      const pending = await encryptTotpSecret(
        JSON.stringify({
          accountId: session.accountId,
          credentialVersion: session.credentialVersion,
          secret: enrollment.secret,
          recoveryCodes,
          createdAt: Date.now(),
        }),
      );
      cookies.set('totp_enrollment_secret', pending, {
        path: '/profile/mfa',
        httpOnly: true,
        sameSite: 'lax',
        secure: !dev,
        maxAge: 600,
      });

      return {
        totpSetup: {
          secret: enrollment.secret,
          qrCodeSvg,
          recoveryCodes,
        },
      };
    } catch (error) {
      if (isRedirect(error)) throw error;
      console.error('Setup TOTP error:', error);
      return fail(500, { error: translate('error.auth.mfa.setup_unavailable', locale) });
    }
  },

  activateTotp: async ({ request, cookies, getClientAddress }) => {
    const locale = getRequestLocale({ request, cookies });
    const session = await requireUserSession(cookies);
    const data = await request.formData();
    const code = data.get('code')?.toString()?.trim();
    const pending = cookies.get('totp_enrollment_secret');
    if (!pending || !code) {
      return fail(400, { error: translate('error.auth.otp.invalid', locale) });
    }

    try {
      const db = await connectDb();
      if (!(await reserveLoginAttempt(db, session.accountId, getClientAddress(), 'mfa'))) {
        return fail(429, { error: translate('error.auth.login.rate_limited', locale) });
      }
      const enrollment = JSON.parse(await decryptTotpSecret(pending)) as {
        accountId: string;
        credentialVersion: number;
        secret: string;
        recoveryCodes: string[];
        createdAt: number;
      };
      if (
        enrollment.accountId !== session.accountId ||
        enrollment.credentialVersion !== session.credentialVersion ||
        !Number.isFinite(enrollment.createdAt) ||
        Date.now() - enrollment.createdAt > 600_000 ||
        Date.now() < enrollment.createdAt
      ) {
        return fail(400, { error: translate('error.auth.transaction.expired', locale) });
      }
      const step = verifyTotpStep(code, {
        issuer: 'Galfus',
        label: session.identifier || 'user',
        secret: enrollment.secret,
      });
      if (step === null) return fail(400, { error: translate('error.auth.otp.invalid', locale) });
      const pepper = recoveryPepper();
      const hashedCodes = await Promise.all(
        enrollment.recoveryCodes.map(async (rc) => ({
          id: generateId(),
          secretHash: await hashRecoveryCode(rc, pepper),
        })),
      );

      const result = await activateDirectTotpAuthenticator(db, {
        accountId: session.accountId,
        credentialVersion: session.credentialVersion,
        authenticatorId: generateId(),
        secretCiphertext: await encryptTotpSecret(enrollment.secret),
        verifiedStep: step,
        codes: hashedCodes,
      });

      if (!result.success || !result.data) {
        return fail(400, { error: translate('error.auth.transaction.state_conflict', locale) });
      }

      const accessToken = await issueAccessToken(
        db,
        { accountId: session.accountId, identifier: session.identifier },
        session.credentialVersion + 1,
      );
      setAuthAccessTokenCookie(cookies, accessToken);

      cookies.delete('totp_enrollment_secret', { path: '/profile/mfa' });

      return {
        success: true,
        updatedField: 'mfa_enabled',
        recoveryCodes: enrollment.recoveryCodes,
      };
    } catch (error) {
      if (isRedirect(error)) throw error;
      console.error('Activate TOTP error:', error);
      return fail(500, { error: translate('error.auth.mfa.setup_unavailable', locale) });
    }
  },

  disableTotp: async ({ request, cookies, getClientAddress }) => {
    const locale = getRequestLocale({ request, cookies });
    const session = await requireUserSession(cookies);

    try {
      const db = await connectDb();
      const form = await request.formData();
      const password = String(form.get('currentPassword') ?? '');
      const code = String(form.get('code') ?? '').trim();
      if (!(await reserveLoginAttempt(db, session.accountId, getClientAddress())))
        return fail(429, { error: translate('error.auth.login.rate_limited', locale) });
      const verified =
        password &&
        password.length <= 128 &&
        (await verifyAccountPassword(db, { accountId: session.accountId, password }));
      if (!verified || !verified.success || !verified.data)
        return fail(401, { error: translate('error.auth.pass.incorrect', locale) });
      if (!/^\d{6}$/.test(code))
        return fail(400, { error: translate('error.auth.otp.invalid', locale) });
      if (!(await reserveLoginAttempt(db, session.accountId, getClientAddress(), 'mfa')))
        return fail(429, { error: translate('error.auth.login.rate_limited', locale) });
      const authenticator = await getActiveMfaAuthenticator(db, {
        accountId: session.accountId,
        kind: 'totp',
      });
      if (!authenticator.success || !authenticator.data?.secretCiphertext)
        return fail(400, { error: translate('error.auth.otp.invalid', locale) });
      const step = verifyTotpStep(code, {
        issuer: 'Galfus',
        label: session.identifier || 'user',
        secret: await decryptTotpSecret(authenticator.data.secretCiphertext),
      });
      if (step === null) return fail(401, { error: translate('error.auth.otp.incorrect', locale) });
      const result = await disableAccountMfa(db, {
        accountId: session.accountId,
        authenticatorId: authenticator.data.id,
        credentialVersion: session.credentialVersion,
        verifiedStep: step,
      });

      if (!result.success) {
        return fail(400, { error: translate('error.auth.otp.invalid', locale) });
      }
      if (!result.data)
        return fail(400, { error: translate('error.auth.otp.already_used', locale) });

      const accessToken = await issueAccessToken(
        db,
        { accountId: session.accountId, identifier: session.identifier },
        session.credentialVersion + 1,
      );
      setAuthAccessTokenCookie(cookies, accessToken);

      return { success: true, updatedField: 'mfa_disabled' };
    } catch (error) {
      if (isRedirect(error)) throw error;
      console.error('Disable TOTP error:', error);
      return fail(500, { error: translate('error.input.invalid', locale) });
    }
  },
};
