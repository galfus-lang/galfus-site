import { fail, redirect } from '@sveltejs/kit';
import { messageIdFromIssues, parseAuthenticationIdentity } from '@galfus/data-manager';
import { findAccountByIdentity } from '@galfus/data-manager/server';
import { translate } from '@galfus/i18n';
import { connectDb } from '$lib/server/db';
import { getRequestLocale } from '$lib/server/i18n';
import { jwt } from '$lib/server/jwt';

export const actions = {
  default: async ({ request, url, cookies }) => {
    const locale = getRequestLocale({ request, cookies });
    const data = await request.formData();
    const returnTo = url.searchParams.get('rto');
    const identifierInput = data.get('identifier');
    const rawIdentifier = typeof identifierInput === 'string' ? identifierInput : '';
    const identityResult = parseAuthenticationIdentity(rawIdentifier);

    if (!identityResult.success) {
      return fail(400, {
        error:
          translate(messageIdFromIssues(identityResult.issues), locale),
        identifier: rawIdentifier.trim(),
      });
    }

    const { provider, identifier } = identityResult.output;

    let account;

    try {
      const db = await connectDb();
      const accountResult = await findAccountByIdentity(db, { identifier });
      if (!accountResult.success) {
        return fail(400, {
          error:
            translate(accountResult.error.id, locale),
          identifier,
        });
      }
      account = accountResult.data;
    } catch (error) {
      console.error('Identity validation error:', error);
      return fail(500, {
        error: translate('error.auth.identity.lookup_failed', locale),
        identifier,
      });
    }

    if (!account) {
      const flowToken = await jwt.sign(
        {
          flow: 'register',
          provider,
          identifier,
          rto: returnTo,
        },
        { expirationTime: '1h' },
      );

      const params = new URLSearchParams({ state: flowToken });
      if (returnTo) params.set('rto', returnTo);
      throw redirect(303, `/register?${params}`);
    }

    if (account.status === 'suspended' || account.status === 'disabled') {
      return fail(403, {
        error: translate('error.auth.account.blocked', locale),
        identifier,
      });
    }

    const flowToken = await jwt.sign(
      {
        flow: 'login',
        accountId: account.id,
        identifier,
        rto: returnTo,
      },
      { expirationTime: '1h' },
    );

    const params = new URLSearchParams({ state: flowToken });
    if (returnTo) params.set('rto', returnTo);
    throw redirect(303, `/challenge?${params}`);
  },
};
