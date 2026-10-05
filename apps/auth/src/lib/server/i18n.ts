import type { RequestEvent } from '@sveltejs/kit';
import { COOKIES_KEYS } from '@galfus/constants';
import { negotiateLocale, safeLocale, type Locale } from '@galfus/i18n';

export function getRequestLocale({ cookies, request }: Pick<RequestEvent, 'cookies' | 'request'>): Locale {
  const savedLocale = cookies.get(COOKIES_KEYS.locale);
  return savedLocale ? safeLocale(savedLocale) : negotiateLocale(request.headers.get('accept-language'));
}
