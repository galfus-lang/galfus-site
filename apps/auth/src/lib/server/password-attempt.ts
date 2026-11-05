import { env } from '$env/dynamic/private';
import { hashSecret } from '@galfus/auth-utils';
import { reservePasswordAttempt } from '@galfus/data-manager/server';
import type { Surreal } from 'surrealdb';

export async function reserveLoginAttempt(
  db: Surreal,
  accountId: string,
  address: string,
  scope: 'login' | 'mfa' = 'login',
): Promise<boolean> {
  const pepper = env.AUTH_RATE_LIMIT_SECRET;
  if (!pepper || pepper.length < 32) throw new Error('AUTH_RATE_LIMIT_SECRET is required.');
  const result = await reservePasswordAttempt(db, {
    scope,
    accountHash: await hashSecret(`${pepper}:account:${accountId}`),
    addressHash: await hashSecret(`${pepper}:address:${address}`),
  });
  return result.success && result.data;
}
