import type { Cookies } from '@sveltejs/kit';
import type { Surreal } from 'surrealdb';
import { AUTH_ACCESS_TOKEN_COOKIE_MAX_AGE } from '@galfus/auth-utils';
import { getAccountAccessState } from '@galfus/data-manager/server';
import { connectDb } from './db';
import {
  clearAuthAccessTokenCookie,
  getAuthAccessTokenCookie,
  setAuthAccessTokenCookie,
} from './auth-cookies';
import { AUTH_ACCESS_JWT_AUDIENCE, jwt } from './jwt';

export interface AccessSession {
  accountId: string;
  identifier?: string;
  rto?: string;
  credentialVersion: number;
}

/** Bind an in-progress login to the credential version checked with its primary factor. */
export function getPrimaryCredentialVersion(transaction: {
  metadata?: { authorization?: { primary_credential_version?: number } };
}): number {
  const version = transaction.metadata?.authorization?.primary_credential_version;
  if (typeof version !== 'number' || !Number.isSafeInteger(version) || version < 0) {
    throw new Error('Authentication transaction has no valid credential version.');
  }
  return version;
}

/** Issue an access token only for an active account using its current credential version. */
export async function issueAccessToken(
  db: Surreal,
  input: Omit<AccessSession, 'credentialVersion'>,
  expectedVersion: number,
): Promise<string> {
  const account = await getAccountAccessState(db, { accountId: input.accountId });
  if (
    !account.success ||
    !account.data ||
    account.data.status !== 'active' ||
    !Number.isSafeInteger(account.data.credential_version) ||
    account.data.credential_version < 0 ||
    account.data.credential_version !== expectedVersion
  ) {
    throw new Error('The account or credential version is no longer valid.');
  }
  return signSession({ ...input, credentialVersion: account.data.credential_version });
}

function signSession(session: AccessSession): Promise<string> {
  return jwt.sign(
    {
      flow: 'access',
      sub: session.accountId,
      accountId: session.accountId,
      credentialVersion: session.credentialVersion,
      ...(session.identifier ? { identifier: session.identifier } : {}),
      ...(session.rto ? { rto: session.rto } : {}),
    },
    { audience: AUTH_ACCESS_JWT_AUDIENCE, expirationTime: `${AUTH_ACCESS_TOKEN_COOKIE_MAX_AGE}s` },
  );
}

/** Verify expiry and account revocation before renewing the browser credential. */
export async function validateAndRenewAccessSession(
  cookies: Cookies,
): Promise<AccessSession | null> {
  const token = getAuthAccessTokenCookie(cookies);
  if (!token) return null;
  let payload;
  try {
    payload = await jwt.verify(token, { audience: AUTH_ACCESS_JWT_AUDIENCE });
  } catch {
    clearAuthAccessTokenCookie(cookies);
    return null;
  }
  if (
    payload.flow !== 'access' ||
    typeof payload.sub !== 'string' ||
    payload.accountId !== payload.sub ||
    typeof payload.exp !== 'number' ||
    !Number.isSafeInteger(payload.credentialVersion) ||
    (payload.credentialVersion as number) < 0
  ) {
    clearAuthAccessTokenCookie(cookies);
    return null;
  }
  const result = await getAccountAccessState(await connectDb(), { accountId: payload.sub });
  if (
    !result.success ||
    !result.data ||
    result.data.status !== 'active' ||
    result.data.credential_version !== payload.credentialVersion
  ) {
    clearAuthAccessTokenCookie(cookies);
    return null;
  }
  const session: AccessSession = {
    accountId: payload.sub,
    credentialVersion: payload.credentialVersion as number,
    ...(typeof payload.identifier === 'string' ? { identifier: payload.identifier } : {}),
    ...(typeof payload.rto === 'string' ? { rto: payload.rto } : {}),
  };
  setAuthAccessTokenCookie(cookies, await signSession(session));
  return session;
}
