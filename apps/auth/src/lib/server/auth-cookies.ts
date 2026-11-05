import {
  AUTH_ACCESS_TOKEN_COOKIE_MAX_AGE,
  AUTH_TRANSACTION_COOKIE_MAX_AGE,
  createAuthCookieDeletionOptions,
  createAuthCookieOptions,
} from '@galfus/auth-utils';
import { COOKIES_KEYS } from '@galfus/constants';
import { dev } from '$app/environment';
import type { Cookies } from '@sveltejs/kit';

const transactionCookieScope = { secure: !dev };
const accessCookieScope = dev
  ? transactionCookieScope
  : { ...transactionCookieScope, domain: '.galfus.com' };

export function setAuthTransactionCookie(cookies: Cookies, value: string): void {
  cookies.set(
    COOKIES_KEYS.auth_transaction,
    value,
    createAuthCookieOptions(AUTH_TRANSACTION_COOKIE_MAX_AGE, transactionCookieScope),
  );
}

export function getAuthTransactionCookie(cookies: Cookies): string | undefined {
  return cookies.get(COOKIES_KEYS.auth_transaction);
}

export function clearAuthTransactionCookie(cookies: Cookies): void {
  cookies.delete(
    COOKIES_KEYS.auth_transaction,
    createAuthCookieDeletionOptions(transactionCookieScope),
  );
}

export function setAuthAccessTokenCookie(cookies: Cookies, value: string): void {
  cookies.set(
    COOKIES_KEYS.auth_access_token,
    value,
    createAuthCookieOptions(AUTH_ACCESS_TOKEN_COOKIE_MAX_AGE, accessCookieScope),
  );
}

export function getAuthAccessTokenCookie(cookies: Cookies): string | undefined {
  return cookies.get(COOKIES_KEYS.auth_access_token);
}

export function clearAuthAccessTokenCookie(cookies: Cookies): void {
  cookies.delete(
    COOKIES_KEYS.auth_access_token,
    createAuthCookieDeletionOptions(accessCookieScope),
  );
}
