import { error } from './error';
import { fields } from './fields';

export const enUS = {
  error,
  fields,
} as const;

export type DictionaryShape<T> = {
  [Key in keyof T]: T[Key] extends string ? string : DictionaryShape<T[Key]>;
};

export type I18nDictionary = DictionaryShape<typeof enUS>;
