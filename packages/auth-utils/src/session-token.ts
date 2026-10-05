import { hashSecret, randomBase64Url } from './secrets';

const sessionPrefixPattern = /^[A-Za-z0-9_-]{16}$/;
const sessionSecretPattern = /^[A-Za-z0-9_-]{43}$/;

export interface AuthSessionToken {
  prefix: string;
  secret: string;
  value: string;
  tokenHash: string;
}

/** Creates a server-verifiable opaque session credential. */
export async function createAuthSessionToken(): Promise<AuthSessionToken> {
  const prefix = randomBase64Url(12);
  const secret = randomBase64Url(32);
  const value = `${prefix}.${secret}`;

  return { prefix, secret, value, tokenHash: await hashSecret(value) };
}

export function parseAuthSessionToken(value: string | null | undefined):
  | Pick<AuthSessionToken, 'prefix' | 'secret'>
  | null {
  if (!value) return null;

  const [prefix, secret, ...rest] = value.split('.');
  if (rest.length > 0 || !prefix || !secret) return null;
  if (!sessionPrefixPattern.test(prefix) || !sessionSecretPattern.test(secret)) return null;

  return { prefix, secret };
}
