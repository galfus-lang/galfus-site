import type { I18nDictionary } from '../en-US';

import { auth } from './auth';
import { email } from './email';
import { error } from './error';
import { fields } from './fields';
import { profile } from './profile';

export const ptBR = {
  auth,
  email,
  error,
  fields,
  profile,
} satisfies I18nDictionary;
