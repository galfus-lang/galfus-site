export interface AuthCookieOptions {
  domain?: string;
  httpOnly: true;
  secure: boolean;
  sameSite: 'lax';
  path: '/';
  maxAge: number;
}

export interface AuthCookieScope {
  secure: boolean;
  domain?: string;
}

export interface AuthCookieDeletionOptions {
  domain?: string;
  path: '/';
}

export const AUTH_TRANSACTION_COOKIE_MAX_AGE = 15 * 60;
export const AUTH_ACCESS_TOKEN_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

export function createAuthCookieOptions(maxAge: number, scope: AuthCookieScope): AuthCookieOptions {
  if (!Number.isSafeInteger(maxAge) || maxAge < 1) {
    throw new Error('Cookie maxAge must be a positive safe integer.');
  }
  if (scope.domain && !/^\.[a-z0-9.-]+$/i.test(scope.domain)) {
    throw new Error('Cookie domain must begin with a dot and contain a valid hostname.');
  }

  return {
    httpOnly: true,
    secure: scope.secure,
    sameSite: 'lax',
    path: '/',
    maxAge,
    ...(scope.domain ? { domain: scope.domain } : {}),
  };
}

/** Builds delete options that exactly match an authentication cookie's scope. */
export function createAuthCookieDeletionOptions(scope: AuthCookieScope): AuthCookieDeletionOptions {
  return { path: '/', ...(scope.domain ? { domain: scope.domain } : {}) };
}
