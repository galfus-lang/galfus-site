import { auth } from './auth';
import { email } from './email';
import { error } from './error';
import { fields } from './fields';
import { profile } from './profile';

export const enUS = {
  auth,
  email,
  error,
  fields,
  profile,
} as const;

export type DictionaryShape<T> = {
  [Key in keyof T]: T[Key] extends string ? string : DictionaryShape<T[Key]>;
};

export type I18nDictionary = DictionaryShape<typeof enUS>;
