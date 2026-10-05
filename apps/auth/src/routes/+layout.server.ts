import { getRequestLocale } from '$lib/server/i18n';

export const load = (event) => ({
  locale: getRequestLocale(event),
});
