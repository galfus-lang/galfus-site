import { createIntl, createIntlCache, type IntlShape } from '@formatjs/intl';

import { DEFAULT_LOCALE, dictionaries, LOCALES, type Locale } from './dictionaries';
import { enUS } from './dictionaries/en-US';

type LeafPath<Value> = Value extends string
  ? never
  : {
      [Key in Extract<keyof Value, string>]: Value[Key] extends string
        ? Key
        : `${Key}.${LeafPath<Value[Key]>}`;
    }[Extract<keyof Value, string>];

export type MessageId = LeafPath<typeof enUS>;
export type ErrorMessageId = Extract<MessageId, `error.${string}`>;
export type MessageValues = Record<
  string,
  string | number | bigint | boolean | null | undefined | Date
>;

function flattenDictionary(dictionary: object, prefix = ''): Record<string, string> {
  return Object.entries(dictionary).reduce<Record<string, string>>((messages, [key, value]) => {
    const id = prefix ? `${prefix}.${key}` : key;

    if (typeof value === 'string') {
      messages[id] = value;
    } else if (value && typeof value === 'object') {
      Object.assign(messages, flattenDictionary(value, id));
    }

    return messages;
  }, {});
}

const messagesByLocale = Object.fromEntries(
  Object.entries(dictionaries).map(([locale, dictionary]) => [locale, flattenDictionary(dictionary)]),
) as Record<Locale, Record<MessageId, string>>;

const intlCache = createIntlCache();
const intlByLocale = new Map<Locale, IntlShape>();

function getIntl(locale: Locale): IntlShape {
  const cached = intlByLocale.get(locale);
  if (cached) return cached;

  const intl = createIntl(
    {
      locale,
      defaultLocale: DEFAULT_LOCALE,
      messages: messagesByLocale[locale],
    },
    intlCache,
  );

  intlByLocale.set(locale, intl);
  return intl;
}

export function safeLocale(locale?: string | null): Locale {
  if (locale && /^[a-z]{2}(?:-[a-zA-Z]{2})?$/.test(locale) && LOCALES.includes(locale as Locale)) {
    return locale as Locale;
  }

  return DEFAULT_LOCALE;
}

export function translate(
  id: MessageId,
  locale: string | null | undefined = DEFAULT_LOCALE,
  values?: MessageValues,
): string {
  return getIntl(safeLocale(locale)).formatMessage(
    {
      id,
      defaultMessage: messagesByLocale[DEFAULT_LOCALE][id],
    },
    values,
  );
}

export function isErrorMessageId(value: unknown): value is ErrorMessageId {
  return (
    typeof value === 'string' &&
    value.startsWith('error.') &&
    value in messagesByLocale[DEFAULT_LOCALE]
  );
}
