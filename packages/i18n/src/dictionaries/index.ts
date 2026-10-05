import { enUS } from './en-US';
import { ptBR } from './pt-BR';

export const dictionaries = {
  'en-US': enUS,
  'pt-BR': ptBR,
} as const;

export const DEFAULT_LOCALE = 'pt-BR';

export type Locale = keyof typeof dictionaries;
export const LOCALES = Object.keys(dictionaries) as Locale[];
