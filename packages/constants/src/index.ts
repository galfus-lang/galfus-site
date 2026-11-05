export const APP_URLS = {
  dev: {
    auth: 'http://localhost:5001',
    main: 'http://localhost:5002',
    blog: 'http://localhost:5003',
  },
  prod: {
    auth: 'https://auth.galfus.com',
    main: 'https://galfus.com',
    blog: 'https://blog.galfus.com',
  },
};

export const COOKIES_KEYS = {
  locale: 'galfus_locale',
  auth_transaction: 'galfus_auth_transaction',
  auth_access_token: 'galfus_auth_access_token',
  active_organization: 'galfus_active_organization',
} as const;

/** Returns the main application URL for the current SvelteKit environment. */
export function getMainAppUrl(isDevelopment: boolean): string {
  return isDevelopment ? APP_URLS.dev.main : APP_URLS.prod.main;
}

/** Returns an allowlisted main-application destination or no value when it is unsafe. */
export function getValidatedMainAppRedirect(
  isDevelopment: boolean,
  returnTo: unknown,
): string | undefined {
  if (typeof returnTo !== 'string' || returnTo.length === 0) {
    return undefined;
  }

  try {
    const fallback = getMainAppUrl(isDevelopment);
    const target = new URL(returnTo, fallback);
    const fallbackOrigin = new URL(fallback).origin;
    const isGalfusDomain =
      !isDevelopment &&
      target.protocol === 'https:' &&
      target.port === '' &&
      (target.hostname === 'galfus.com' || target.hostname.endsWith('.galfus.com'));

    return target.origin === fallbackOrigin || isGalfusDomain ? target.toString() : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Resolves an optional return-to URL. Relative URLs use the main application URL as a base;
 * absolute URLs may target galfus.com or one of its HTTPS subdomains.
 */
export function resolveMainAppRedirect(isDevelopment: boolean, returnTo: unknown): string {
  const fallback = getMainAppUrl(isDevelopment);
  return getValidatedMainAppRedirect(isDevelopment, returnTo) ?? fallback;
}
