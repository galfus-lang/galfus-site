import { fail, isRedirect, type RequestEvent } from '@sveltejs/kit';
import { dev } from '$app/environment';
import {
  clearAuthAccessTokenCookie,
  clearAuthTransactionCookie,
  setAuthAccessTokenCookie,
} from '$lib/server/auth-cookies';
import { connectDb } from '$lib/server/db';
import { getRequestLocale } from '$lib/server/i18n';
import { issueAccessToken } from '$lib/server/access-session';
import { requireUserSession } from '$lib/server/user-session';
import { getPasskeyRelyingParty } from '$lib/server/passkey';
import { jwt } from '$lib/server/jwt';
import { reserveLoginAttempt } from '$lib/server/password-attempt';
import { temporaryRedirect } from '$lib/server/temporary-redirect';
import {
  createPasskeyRegistrationOptions,
  generateId,
  toBase64Url,
  verifyPasskeyRegistration,
  type RegistrationResponseJSON,
} from '@galfus/auth-utils';
import {
  getAccountPasskeys,
  getAccountProfile,
  incrementAccountCredentialVersion,
  persistVerifiedPasskeyAuthenticator,
  removeAccountAuthenticator,
  updateAccountProfile,
  upsertAccountPassword,
  verifyAccountPassword,
} from '@galfus/data-manager/server';
import { translate } from '@galfus/i18n';

const PASSKEY_REGISTRATION_AUDIENCE = 'galfus:passkey-registration';

export const load = async ({ cookies }) => {
  const session = await requireUserSession(cookies);

  try {
    const db = await connectDb();
    const profileResult = await getAccountProfile(db, { accountId: session.accountId });

    if (!profileResult.success || !profileResult.data) {
      clearAuthAccessTokenCookie(cookies);
      throw temporaryRedirect('/');
    }

    return {
      profile: profileResult.data,
      identifier: session.identifier,
    };
  } catch (error) {
    if (isRedirect(error)) throw error;
    console.error('Failed to load profile:', error);
    throw error;
  }
};

export const actions = {
  updateProfile: async ({ request, cookies }: Pick<RequestEvent, 'request' | 'cookies'>) => {
    const locale = getRequestLocale({ request, cookies });
    const session = await requireUserSession(cookies);
    const data = await request.formData();
    const displayName = data.get('displayName')?.toString()?.trim();

    if (!displayName || displayName.length < 2) {
      return fail(400, { error: translate('error.fields.full_name.too_short', locale) });
    }

    try {
      const db = await connectDb();
      const result = await updateAccountProfile(db, {
        accountId: session.accountId,
        displayName,
      });

      if (!result.success) {
        return fail(400, { error: translate('error.input.invalid', locale) });
      }

      return { success: true, updatedField: 'profile' };
    } catch (error) {
      if (isRedirect(error)) throw error;
      console.error('Profile update error:', error);
      return fail(500, { error: translate('error.input.invalid', locale) });
    }
  },

  changePassword: async ({
    request,
    cookies,
    getClientAddress,
  }: Pick<RequestEvent, 'request' | 'cookies' | 'getClientAddress'>) => {
    const locale = getRequestLocale({ request, cookies });
    const session = await requireUserSession(cookies);
    const data = await request.formData();
    const currentPassword = data.get('currentPassword')?.toString();
    const newPassword = data.get('newPassword')?.toString();
    const confirmNewPassword = data.get('confirmNewPassword')?.toString();

    if (currentPassword && currentPassword.length > 128) {
      return fail(400, { error: translate('error.auth.pass.incorrect', locale) });
    }

    if (!newPassword || !confirmNewPassword) {
      return fail(400, { error: translate('error.auth.pass.required', locale) });
    }

    if (newPassword.length < 8) {
      return fail(400, { error: translate('error.auth.pass.too_short', locale) });
    }

    if (newPassword.length > 128) {
      return fail(400, { error: translate('error.auth.pass.too_long', locale) });
    }

    if (newPassword !== confirmNewPassword) {
      return fail(400, { error: translate('error.auth.pass.password_dont_match', locale) });
    }

    try {
      const db = await connectDb();
      const profileResult = await getAccountProfile(db, { accountId: session.accountId });

      if (!profileResult.success || !profileResult.data) {
        return fail(400, { error: translate('error.auth.login.failed', locale) });
      }

      if (profileResult.data.security.hasPassword) {
        if (!currentPassword) {
          return fail(400, { error: translate('error.auth.pass.required', locale) });
        }
        if (!(await reserveLoginAttempt(db, session.accountId, getClientAddress())))
          return fail(429, { error: translate('error.auth.login.rate_limited', locale) });
        const verifyResult = await verifyAccountPassword(db, {
          accountId: session.accountId,
          password: currentPassword,
        });
        if (!verifyResult.success || !verifyResult.data) {
          return fail(401, { error: translate('error.auth.pass.incorrect', locale) });
        }
      }

      const upsertResult = await upsertAccountPassword(db, {
        accountId: session.accountId,
        password: newPassword,
      });

      if (!upsertResult.success) {
        return fail(400, { error: translate('error.auth.login.failed', locale) });
      }

      const refreshedToken = await issueAccessToken(
        db,
        { accountId: session.accountId, identifier: session.identifier },
        session.credentialVersion + 1,
      );
      setAuthAccessTokenCookie(cookies, refreshedToken);

      return { success: true, updatedField: 'password' };
    } catch (error) {
      if (isRedirect(error)) throw error;
      console.error('Password change error:', error);
      return fail(500, { error: translate('error.auth.login.failed', locale) });
    }
  },

  passkeyRegistrationOptions: async ({
    request,
    cookies,
    getClientAddress,
  }: Pick<RequestEvent, 'request' | 'cookies' | 'getClientAddress'>) => {
    const locale = getRequestLocale({ request, cookies });
    const session = await requireUserSession(cookies);

    try {
      const db = await connectDb();
      const profileResult = await getAccountProfile(db, { accountId: session.accountId });
      if (!profileResult.success || !profileResult.data) {
        return fail(400, { error: translate('error.auth.account.invalid', locale) });
      }
      const form = await request.formData();
      const password = String(form.get('currentPassword') ?? '');
      if (!(await reserveLoginAttempt(db, session.accountId, getClientAddress())))
        return fail(429, { error: translate('error.auth.login.rate_limited', locale) });
      const verified =
        password &&
        password.length <= 128 &&
        (await verifyAccountPassword(db, {
          accountId: session.accountId,
          password,
        }));
      if (!verified || !verified.success || !verified.data)
        return fail(401, { error: translate('error.auth.pass.incorrect', locale) });
      const passkeys = await getAccountPasskeys(db, session.accountId);

      const origin = request.headers.get('origin');
      const relyingParty = getPasskeyRelyingParty(origin);

      const displayName = profileResult.data.account.displayName;

      const userName = session.identifier || displayName;

      const options = await createPasskeyRegistrationOptions({
        relyingParty,
        accountId: session.accountId,
        userName,
        userDisplayName: displayName,
        existingPasskeys: passkeys.map((p) => ({
          credentialId: p.credentialId,
          transports: p.transports,
        })),
      });

      const challengeToken = await jwt.sign(
        {
          flow: 'passkey_registration',
          sub: session.accountId,
          credentialVersion: session.credentialVersion,
          challenge: options.challenge,
        },
        { audience: PASSKEY_REGISTRATION_AUDIENCE, expirationTime: '5m' },
      );
      cookies.set('passkey_reg_challenge', challengeToken, {
        path: '/profile',
        httpOnly: true,
        sameSite: 'lax',
        secure: !dev,
        maxAge: 300,
      });

      return { options };
    } catch (error) {
      if (isRedirect(error)) throw error;
      console.error('Passkey registration options error:', error);
      return fail(500, { error: translate('error.auth.login.failed', locale) });
    }
  },

  verifyPasskeyRegistration: async ({
    request,
    cookies,
  }: Pick<RequestEvent, 'request' | 'cookies'>) => {
    const locale = getRequestLocale({ request, cookies });
    const session = await requireUserSession(cookies);

    try {
      const body = await request.formData();
      const response = JSON.parse(String(body.get('response') ?? 'null')) as
        RegistrationResponseJSON | undefined;
      const label = body.get('label')?.toString().trim();

      if (!response?.id) {
        return fail(400, { error: translate('error.input.invalid', locale) });
      }

      const challengeToken = cookies.get('passkey_reg_challenge');
      if (!challengeToken) {
        return fail(400, { error: translate('error.auth.transaction.expired', locale) });
      }

      cookies.delete('passkey_reg_challenge', { path: '/profile' });

      let challenge;
      try {
        challenge = await jwt.verify(challengeToken, { audience: PASSKEY_REGISTRATION_AUDIENCE });
      } catch {
        return fail(400, { error: translate('error.auth.transaction.expired', locale) });
      }
      if (
        challenge.flow !== 'passkey_registration' ||
        challenge.sub !== session.accountId ||
        challenge.credentialVersion !== session.credentialVersion ||
        typeof challenge.challenge !== 'string' ||
        !challenge.challenge
      ) {
        return fail(400, { error: translate('error.auth.transaction.invalid', locale) });
      }

      const origin = request.headers.get('origin');
      const relyingParty = getPasskeyRelyingParty(origin);

      const verification = await verifyPasskeyRegistration({
        relyingParty,
        expectedChallenge: challenge.challenge,
        response,
        webauthnUserId: toBase64Url(new TextEncoder().encode(session.accountId)),
      });

      if (!verification.verified || !verification.passkey) {
        return fail(400, { error: translate('error.auth.login.failed', locale) });
      }

      const db = await connectDb();
      const persistResult = await persistVerifiedPasskeyAuthenticator(db, {
        id: generateId(),
        accountId: session.accountId,
        credentialVersion: session.credentialVersion,
        credentialId: verification.passkey.credentialId,
        webauthnUserId: verification.passkey.webauthnUserId,
        publicKey: verification.passkey.publicKey,
        counter: verification.passkey.counter,
        transports: verification.passkey.transports,
        deviceType: verification.passkey.deviceType,
        backedUp: verification.passkey.backedUp,
        label,
      });

      if (!persistResult.success) {
        return fail(400, { error: translate('error.auth.transaction.state_conflict', locale) });
      }

      return { success: true };
    } catch (error) {
      if (isRedirect(error)) throw error;
      console.error('Passkey registration verification error:', error);
      return fail(500, { error: translate('error.auth.login.failed', locale) });
    }
  },

  removePasskey: async ({ request, cookies }: Pick<RequestEvent, 'request' | 'cookies'>) => {
    const locale = getRequestLocale({ request, cookies });
    const session = await requireUserSession(cookies);
    const data = await request.formData();
    const authenticatorId = data.get('authenticatorId')?.toString();

    if (!authenticatorId) {
      return fail(400, { error: translate('error.input.invalid', locale) });
    }

    try {
      const db = await connectDb();
      const result = await removeAccountAuthenticator(db, {
        accountId: session.accountId,
        authenticatorId,
      });

      if (!result.success || !result.data) {
        return fail(400, { error: translate('error.auth.passkey.remove_failed', locale) });
      }

      return { success: true, updatedField: 'passkey_removed' };
    } catch (error) {
      if (isRedirect(error)) throw error;
      console.error('Remove passkey error:', error);
      return fail(500, { error: translate('error.auth.passkey.remove_failed', locale) });
    }
  },

  revokeOtherSessions: async ({ request, cookies }: Pick<RequestEvent, 'request' | 'cookies'>) => {
    const locale = getRequestLocale({ request, cookies });
    const session = await requireUserSession(cookies);

    try {
      const db = await connectDb();
      const result = await incrementAccountCredentialVersion(db, {
        accountId: session.accountId,
      });

      if (!result.success) {
        return fail(400, { error: translate('error.input.invalid', locale) });
      }

      const refreshedToken = await issueAccessToken(
        db,
        { accountId: session.accountId, identifier: session.identifier },
        session.credentialVersion + 1,
      );
      setAuthAccessTokenCookie(cookies, refreshedToken);

      return { success: true, updatedField: 'sessions_revoked' };
    } catch (error) {
      if (isRedirect(error)) throw error;
      console.error('Revoke sessions error:', error);
      return fail(500, { error: translate('error.input.invalid', locale) });
    }
  },

  logout: async ({ cookies }: Pick<RequestEvent, 'cookies'>) => {
    clearAuthAccessTokenCookie(cookies);
    clearAuthTransactionCookie(cookies);
    cookies.delete('passkey_reg_challenge', { path: '/profile' });
    cookies.delete('totp_enrollment_secret', { path: '/profile/mfa' });
    throw temporaryRedirect('/');
  },
};
