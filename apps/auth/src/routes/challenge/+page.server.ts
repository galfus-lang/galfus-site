import { fail, redirect, isRedirect } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { resolveMainAppRedirect } from '@galfus/constants';
import {
  getAccountAuthenticationState,
  verifyAccountPassword,
} from '@galfus/data-manager/server';
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

    if (payload.flow !== 'login') {
      throw redirect(303, '/');
    }

    const accountId = typeof payload.accountId === 'string' ? payload.accountId : '';
    const identifier = typeof payload.identifier === 'string' ? payload.identifier : '';
    if (!accountId || !identifier) {
      throw redirect(303, '/');
    }

    const db = await connectDb();
    const authenticationStateResult = await getAccountAuthenticationState(db, { accountId });
    if (!authenticationStateResult.success || !authenticationStateResult.data) {
      throw redirect(303, '/');
    }
    const authenticationState = authenticationStateResult.data;

    return {
      identifier,
      accountId,
      hasPasskey: authenticationState.hasPasskey,
      stateToken: state,
    };
  } catch (e) {
    if (isRedirect(e)) throw e;
    throw redirect(303, '/?error=invalid_session');
  }
};

export const actions = {
  default: async ({ request, cookies }) => {
    const locale = getRequestLocale({ request, cookies });
    const data = await request.formData();
    const state = data.get('state')?.toString();
    const password = data.get('password')?.toString();

    if (!state || !password) {
      return fail(400, { error: translate('error.auth.pass.required', locale) });
    }

    try {
      // 1. Validate the flow token
      const payload = await jwt.verify(state);
      if (payload.flow !== 'login' || !payload.accountId) {
        return fail(403, { error: translate('error.auth.login.session_invalid', locale) });
      }

      const accountId = typeof payload.accountId === 'string' ? payload.accountId : '';
      const identifier = typeof payload.identifier === 'string' ? payload.identifier : '';
      if (!accountId || !identifier) {
        return fail(403, { error: translate('error.auth.login.session_invalid', locale) });
      }

      const db = await connectDb();
      const authenticationStateResult = await getAccountAuthenticationState(db, { accountId });
      if (!authenticationStateResult.success || !authenticationStateResult.data) {
        return fail(403, { error: translate('error.auth.login.session_invalid', locale) });
      }
      const authenticationState = authenticationStateResult.data;

      // 2. Verify the password through the authentication repository.
      const passwordResult = await verifyAccountPassword(db, {
        accountId,
        password,
      });

      if (!passwordResult.success) {
        return fail(400, {
          error: translate(passwordResult.error.id, locale),
        });
      }

      const passwordMatches = passwordResult.data;

      if (!passwordMatches) {
        // Password did not match or no password key exists
        return fail(401, { error: translate('error.auth.pass.incorrect', locale) });
      }

      // 3. Password is correct!
      // If MFA is required, issue an MFA flow token
      if (authenticationState.mfaEnabled) {
        const mfaToken = await jwt.sign(
          {
            flow: 'mfa',
            accountId,
            identifier,
            rto: payload.rto,
          },
          { expirationTime: '1h' },
        );
        throw redirect(303, `/mfa?state=${mfaToken}`);
      }

      // 4. No MFA required. Issue the final Session JWT
      const sessionToken = await jwt.sign(
        {
          flow: 'session',
          accountId,
          identifier,
        },
        { expirationTime: '7d' }, // Session valid for 7 days
      );

      cookies.set('galfus_auth_session', sessionToken, {
        path: '/',
        httpOnly: true,
        secure: !dev,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
      });

      // 5. Return to the requested main-app path, or to the environment fallback.
      const redirectUrl = resolveMainAppRedirect(dev, payload.rto);

      throw redirect(303, redirectUrl);
    } catch (e) {
      if (isRedirect(e)) {
        throw e;
      }

      console.error('Challenge error:', e);
      return fail(500, { error: translate('error.auth.login.failed', locale) });
    }
  },
};
