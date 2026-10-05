import {
  AUTH_SESSION_COOKIE_MAX_AGE,
  AUTH_TRANSACTION_COOKIE_MAX_AGE,
  createAuthCookieOptions,
} from '@galfus/auth-utils';
import { COOKIES_KEYS } from '@galfus/constants';
import { dev } from '$app/environment';
import type { Cookies } from '@sveltejs/kit';

const secure = !dev;

export function setAuthTransactionCookie(cookies: Cookies, value: string): void {
  cookies.set(
    COOKIES_KEYS.auth_transaction,
    value,
    createAuthCookieOptions(AUTH_TRANSACTION_COOKIE_MAX_AGE, secure),
  );
}

export function getAuthTransactionCookie(cookies: Cookies): string | undefined {
  return cookies.get(COOKIES_KEYS.auth_transaction);
}

export function clearAuthTransactionCookie(cookies: Cookies): void {
  cookies.delete(COOKIES_KEYS.auth_transaction, { path: '/' });
}

export function setAuthSessionCookie(cookies: Cookies, value: string): void {
  cookies.set(
    COOKIES_KEYS.auth_session,
    value,
    createAuthCookieOptions(AUTH_SESSION_COOKIE_MAX_AGE, secure),
  );
}

export function getAuthSessionCookie(cookies: Cookies): string | undefined {
  return cookies.get(COOKIES_KEYS.auth_session);
}

export function clearAuthSessionCookie(cookies: Cookies): void {
  cookies.delete(COOKIES_KEYS.auth_session, { path: '/' });
}
