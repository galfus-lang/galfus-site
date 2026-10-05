import { isRedirect, redirect, fail } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { resolveMainAppRedirect } from '@galfus/constants';
import {
  messageIdFromIssues,
  parseAuthenticationIdentity,
  parseRegistrationCredentials,
} from '@galfus/data-manager';
import { createPasswordAccount } from '@galfus/data-manager/server';
import { translate } from '@galfus/i18n';
import { connectDb } from '$lib/server/db';
import { getRequestLocale } from '$lib/server/i18n';
import { jwt } from '$lib/server/jwt';

export const load = async ({ url }) => {
  const state = url.searchParams.get('state');

  if (!state) {
    throw redirect(303, '/');
  }

  try {
    const payload = await jwt.verify(state);
    const identityResult = parseAuthenticationIdentity(payload.identifier);

    if (
      payload.flow !== 'register' ||
      !identityResult.success ||
      (payload.provider !== 'email' && payload.provider !== 'username') ||
      payload.provider !== identityResult.output.provider
    ) {
      throw redirect(303, '/');
    }

    return {
      identifier: identityResult.output.identifier,
      stateToken: state,
    };
  } catch (e) {
    // Token is invalid, expired, or tampered with
    throw redirect(303, '/?error=invalid_session');
  }
};

export const actions = {
  default: async ({ request, cookies }) => {
    const locale = getRequestLocale({ request, cookies });
    const data = await request.formData();
    const stateInput = data.get('state');
    const fullNameInput = data.get('fullName');
    const passwordInput = data.get('password');
    const confirmPasswordInput = data.get('confirmPassword');
    const state = typeof stateInput === 'string' ? stateInput : '';
    const fullName = typeof fullNameInput === 'string' ? fullNameInput : '';
    const password = typeof passwordInput === 'string' ? passwordInput : '';
    const confirmPassword = typeof confirmPasswordInput === 'string' ? confirmPasswordInput : '';

    if (!state) {
      return fail(400, {
        error: translate('error.auth.registration.session_missing', locale),
        fullName: fullName.trim(),
      });
    }

    const registrationResult = parseRegistrationCredentials({
      fullName,
      password,
      confirmPassword,
    });
    if (!registrationResult.success) {
      return fail(400, {
        error: translate(messageIdFromIssues(registrationResult.issues), locale),
        fullName: fullName.trim(),
      });
    }

    const credentials = registrationResult.output;
    let payload;

    try {
      payload = await jwt.verify(state);
    } catch {
      return fail(403, {
        error: translate('error.auth.registration.session_invalid', locale),
        fullName: credentials.fullName,
      });
    }

    const identityResult = parseAuthenticationIdentity(payload.identifier);
    const provider = payload.provider;

    if (
      payload.flow !== 'register' ||
      !identityResult.success ||
      (provider !== 'email' && provider !== 'username') ||
      provider !== identityResult.output.provider
    ) {
      return fail(403, {
        error: translate('error.auth.registration.session_invalid', locale),
        fullName: credentials.fullName,
      });
    }

    const { identifier } = identityResult.output;

    try {
      const db = await connectDb();

      // 2. Create the account and its credentials in one database transaction.
      const accountResult = await createPasswordAccount(db, {
        fullName: credentials.fullName,
        identifier,
        password: credentials.password,
      });

      if (!accountResult.success) {
        if (accountResult.error.code === 'conflict') {
          return fail(409, {
            error: translate(accountResult.error.id, locale),
            fullName: credentials.fullName,
          });
        }

        return fail(400, {
          error: translate(accountResult.error.id, locale),
          fullName: credentials.fullName,
        });
      }

      const accountId = String(accountResult.data.id);

      // 3. Issue the final Session JWT since the user successfully signed up!
      const sessionToken = await jwt.sign(
        {
          flow: 'session',
          accountId: accountId,
          identifier: identifier,
          // They just created a password, so they are fully authenticated
        },
        { expirationTime: '7d' }, // Session valid for 7 days
      );

      // Set the secure cookie
      cookies.set('galfus_auth_session', sessionToken, {
        path: '/',
        httpOnly: true,
        secure: !dev,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });

      // 4. Return to the requested main-app path, or to the environment fallback.
      const redirectUrl = resolveMainAppRedirect(dev, payload.rto);

      throw redirect(303, redirectUrl);
    } catch (e) {
      if (isRedirect(e)) {
        throw e;
      }

      console.error('Registration error:', e);
      return fail(500, {
        error: translate('error.auth.registration.failed', locale),
        fullName: credentials.fullName,
      });
    }
  },
};
