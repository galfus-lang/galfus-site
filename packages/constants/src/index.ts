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
} as const;

/** Returns the main application URL for the current SvelteKit environment. */
export function getMainAppUrl(isDevelopment: boolean): string {
  return isDevelopment ? APP_URLS.dev.main : APP_URLS.prod.main;
}

/**
 * Resolves an optional return-to URL. Relative URLs use the main application URL as a base;
 * absolute URLs may target galfus.com or one of its HTTPS subdomains.
 */
export function resolveMainAppRedirect(isDevelopment: boolean, returnTo: unknown): string {
  const fallback = getMainAppUrl(isDevelopment);

  if (typeof returnTo !== 'string' || returnTo.length === 0) {
    return fallback;
  }

  try {
    const target = new URL(returnTo, fallback);
    const fallbackOrigin = new URL(fallback).origin;
    const isGalfusDomain =
      target.protocol === 'https:' &&
      target.port === '' &&
      (target.hostname === 'galfus.com' || target.hostname.endsWith('.galfus.com'));

    return target.origin === fallbackOrigin || isGalfusDomain ? target.toString() : fallback;
  } catch {
    return fallback;
  }
}
