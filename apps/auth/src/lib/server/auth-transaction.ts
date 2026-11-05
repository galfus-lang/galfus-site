import type { Cookies } from '@sveltejs/kit';
import { hashSecret, parseAuthTransactionToken } from '@galfus/auth-utils';
import type { AuthTransactionKind, AuthTransactionStatus } from '@galfus/data-manager';
import { getAuthTransaction, type AuthTransactionView } from '@galfus/data-manager/server';
import { clearAuthTransactionCookie, getAuthTransactionCookie } from './auth-cookies';
import { connectDb } from './db';
import { temporaryRedirect } from './temporary-redirect';

export interface ValidatedTransactionContext<K extends AuthTransactionKind = AuthTransactionKind> {
  token: {
    id: string;
    verifier: string;
    verifierHash: string;
  };
  transaction: AuthTransactionView<K>;
}

/**
 * Validates the current browser journey from the auth_transaction HttpOnly cookie.
 * If missing, invalid, or outside admissible states, clears the cookie and redirects to `/`.
 */
export async function requireAuthTransaction<K extends AuthTransactionKind = AuthTransactionKind>(
  cookies: Cookies,
  options: {
    allowedKinds: K[];
    allowedStatuses: AuthTransactionStatus[];
  },
): Promise<ValidatedTransactionContext<K>> {
  const cookie = getAuthTransactionCookie(cookies);
  if (!cookie) {
    throw temporaryRedirect('/');
  }

  const token = parseAuthTransactionToken(cookie);
  if (!token) {
    clearAuthTransactionCookie(cookies);
    throw temporaryRedirect('/?auth_error=1');
  }

  const verifierHash = await hashSecret(token.verifier);
  const db = await connectDb();
  const result = await getAuthTransaction(db, {
    id: token.id,
    browserVerifierHash: verifierHash,
  });

  if (!result.success) {
    clearAuthTransactionCookie(cookies);
    throw temporaryRedirect('/?auth_error=1');
  }

  const tx = result.data;
  if (
    !options.allowedKinds.includes(tx.kind as K) ||
    !options.allowedStatuses.includes(tx.status as AuthTransactionStatus)
  ) {
    if (
      tx.kind === 'authorization' &&
      tx.status === 'awaiting_mfa' &&
      tx.metadata?.authorization?.pending_mfa_method === 'totp'
    )
      throw temporaryRedirect('/mfa-otp');
    if (tx.kind === 'authorization' && tx.status === 'awaiting_primary')
      throw temporaryRedirect('/challenge');
    if (tx.kind === 'registration' && tx.status === 'awaiting_primary')
      throw temporaryRedirect('/register');
    clearAuthTransactionCookie(cookies);
    throw temporaryRedirect('/?auth_error=1');
  }

  return {
    token: {
      id: token.id,
      verifier: token.verifier,
      verifierHash,
    },
    transaction: tx as AuthTransactionView<K>,
  };
}
