import { env } from '$env/dynamic/private';
import { decryptSecret, encryptSecret } from '@galfus/auth-utils';

function encryptionKey(): string {
  if (!env.AUTH_TOTP_KEY) throw new Error('AUTH_TOTP_KEY is required.');
  return env.AUTH_TOTP_KEY;
}

export function recoveryPepper(): string {
  if (!env.AUTH_RECOVERY_PEPPER || env.AUTH_RECOVERY_PEPPER.length < 32) {
    throw new Error('AUTH_RECOVERY_PEPPER must contain at least 32 characters.');
  }
  return env.AUTH_RECOVERY_PEPPER;
}

export async function encryptTotpSecret(value: string): Promise<string> {
  return encryptSecret(value, encryptionKey());
}

export async function decryptTotpSecret(value: string): Promise<string> {
  return decryptSecret(value, encryptionKey());
}
