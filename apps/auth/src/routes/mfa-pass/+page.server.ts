import { clearAuthTransactionCookie } from '$lib/server/auth-cookies';
import { temporaryRedirect } from '$lib/server/temporary-redirect';
import type { Cookies } from '@sveltejs/kit';

function rejectUnsupportedMethod(cookies: Cookies): never {
  clearAuthTransactionCookie(cookies);
  throw temporaryRedirect('/');
}

export const load = ({ cookies }) => rejectUnsupportedMethod(cookies);

export const actions = {
  verify: ({ cookies }) => rejectUnsupportedMethod(cookies),
  resend: ({ cookies }) => rejectUnsupportedMethod(cookies),
};
