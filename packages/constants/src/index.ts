export const GALFUS_MAIN_APP_URL = {
  development: 'http://localhost:5002',
  production: 'https://galfus.com',
} as const;

/** Returns the main application URL for the current SvelteKit environment. */
export function getMainAppUrl(isDevelopment: boolean): string {
  return isDevelopment ? GALFUS_MAIN_APP_URL.development : GALFUS_MAIN_APP_URL.production;
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
