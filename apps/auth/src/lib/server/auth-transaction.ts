import { isRedirect, type Cookies } from '@sveltejs/kit';
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
    throw temporaryRedirect('/');
  }

  try {
    const verifierHash = await hashSecret(token.verifier);
    const db = await connectDb();
    const result = await getAuthTransaction(db, {
      id: token.id,
      browserVerifierHash: verifierHash,
    });

    if (!result.success) {
      clearAuthTransactionCookie(cookies);
      throw temporaryRedirect('/');
    }

    const tx = result.data;
    if (
      !options.allowedKinds.includes(tx.kind as K) ||
      !options.allowedStatuses.includes(tx.status as AuthTransactionStatus)
    ) {
      clearAuthTransactionCookie(cookies);
      throw temporaryRedirect('/');
    }

    return {
      token: {
        id: token.id,
        verifier: token.verifier,
        verifierHash,
      },
      transaction: tx as AuthTransactionView<K>,
    };
  } catch (error) {
    if (isRedirect(error)) throw error;
    clearAuthTransactionCookie(cookies);
    throw temporaryRedirect('/');
  }
}
