import { generateId } from './id';
import { hashSecret, randomBase64Url } from './secrets';

const transactionIdPattern = /^[0-9A-HJKMNP-TV-Z]{26}$/;
const verifierPattern = /^[A-Za-z0-9_-]{43}$/;

export interface AuthTransactionToken {
  id: string;
  verifier: string;
  value: string;
  verifierHash: string;
}

/** Creates an opaque browser-bound authorization transaction credential. */
export async function createAuthTransactionToken(): Promise<AuthTransactionToken> {
  const id = generateId();
  const verifier = randomBase64Url(32);

  return {
    id,
    verifier,
    value: `${id}.${verifier}`,
    verifierHash: await hashSecret(verifier),
  };
}

export function parseAuthTransactionToken(value: string | null | undefined):
  | Pick<AuthTransactionToken, 'id' | 'verifier'>
  | null {
  if (!value) return null;

  const [id, verifier, ...rest] = value.split('.');
  if (rest.length > 0 || !id || !verifier) return null;
  if (!transactionIdPattern.test(id) || !verifierPattern.test(verifier)) return null;

  return { id, verifier };
}
