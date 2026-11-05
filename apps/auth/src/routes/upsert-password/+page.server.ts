import { fail, isRedirect } from '@sveltejs/kit';
import {
  clearAuthTransactionCookie,
  clearAuthAccessTokenCookie,
  setAuthTransactionCookie,
} from '$lib/server/auth-cookies';
import { requireAuthTransaction } from '$lib/server/auth-transaction';
import { connectDb } from '$lib/server/db';
import { getRequestLocale } from '$lib/server/i18n';
import { temporaryRedirect } from '$lib/server/temporary-redirect';
import { parseAuthTransactionToken } from '@galfus/auth-utils';
import { completeUpsertPasswordTransaction } from '@galfus/data-manager/server';
import { translate } from '@galfus/i18n';

function extractAccountId(account: unknown): string {
  if (!account) return '';
  if (typeof account === 'string') return account;
  if (typeof account === 'object' && 'id' in account) {
    return (account as { toString(): string }).toString();
  }
  return String(account);
}

export const load = async ({ cookies, url, setHeaders }) => {
  setHeaders({ 'cache-control': 'no-store', 'referrer-policy': 'no-referrer' });
  const code = url.searchParams.get('code');
  if (code) {
    const token = parseAuthTransactionToken(code);
    if (token) {
      setAuthTransactionCookie(cookies, code);
      throw temporaryRedirect('/upsert-password');
    }
  }

  await requireAuthTransaction(cookies, {
    allowedKinds: ['upsert_password', 'password_recovery'],
    allowedStatuses: ['pending', 'awaiting_primary', 'authorized'],
  });

  return {};
};

export const actions = {
  default: async ({ request, cookies }) => {
    const locale = getRequestLocale({ request, cookies });
    const data = await request.formData();
    const password = data.get('password')?.toString();
    const confirmPassword = data.get('confirmPassword')?.toString();

    if (!password || !confirmPassword) {
      return fail(400, { error: translate('error.auth.pass.required', locale) });
    }

    if (password.length < 8) {
      return fail(400, { error: translate('error.auth.pass.too_short', locale) });
    }

    if (password.length > 128) {
      return fail(400, { error: translate('error.auth.pass.too_long', locale) });
    }

    if (password !== confirmPassword) {
      return fail(400, { error: translate('error.auth.pass.password_dont_match', locale) });
    }

    const { token, transaction } = await requireAuthTransaction(cookies, {
      allowedKinds: ['upsert_password', 'password_recovery'],
      allowedStatuses: ['pending', 'awaiting_primary', 'authorized'],
    });

    const accountId = extractAccountId(transaction.account);
    if (!accountId) {
      clearAuthTransactionCookie(cookies);
      throw temporaryRedirect('/');
    }

    try {
      const db = await connectDb();
      const completeResult = await completeUpsertPasswordTransaction(db, {
        id: token.id,
        browserVerifierHash: token.verifierHash,
        expectedVersion: transaction.version,
        accountId,
        password,
      });

      if (!completeResult.success) {
        return fail(400, { error: translate('error.auth.transaction.state_conflict', locale) });
      }

      clearAuthAccessTokenCookie(cookies);
      clearAuthTransactionCookie(cookies);
      const query = new URLSearchParams({ password_reset: '1' });
      if (completeResult.data.return_to) query.set('rto', completeResult.data.return_to);
      throw temporaryRedirect(`/?${query}`);
    } catch (error) {
      if (isRedirect(error)) throw error;
      console.error('Upsert password error:', error);
      return fail(500, { error: translate('error.auth.login.failed', locale) });
    }
  },
};
