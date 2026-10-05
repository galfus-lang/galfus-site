export interface AuthCookieOptions {
  httpOnly: true;
  secure: boolean;
  sameSite: 'lax';
  path: '/';
  maxAge: number;
}

export const AUTH_TRANSACTION_COOKIE_MAX_AGE = 15 * 60;
export const AUTH_SESSION_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

export function createAuthCookieOptions(
  maxAge: number,
  secure: boolean,
): AuthCookieOptions {
  if (!Number.isSafeInteger(maxAge) || maxAge < 1) {
    throw new Error('Cookie maxAge must be a positive safe integer.');
  }

  return { httpOnly: true, secure, sameSite: 'lax', path: '/', maxAge };
}
