import type { Surreal } from 'surrealdb';

import type { Account, AccountIdentity, AccountKey, AccountPasskey } from '../generated';
import { conflict, invalidInput, type DataManagerResult } from '../errors';
import {
  parseCreatePasswordAccountInput,
  parseFindAccountByIdentityInput,
  VerifyAccountPasswordInputSchema,
  GetAccountAuthenticationStateInputSchema,
} from '../inputs/accounts';
import * as v from 'valibot';

export type AuthenticationAccount = Pick<Account, 'id' | 'mfaEnabled' | 'status'>;

export interface AccountAuthenticationState {
  hasPasskey: boolean;
  mfaEnabled: boolean;
}

type IdentityWithAccount = Pick<AccountIdentity, 'account'> & {
  account?: AuthenticationAccount;
};

type CreatedIdentityRow = Pick<AccountIdentity, 'account'>;
type IdentityRow = Pick<AccountIdentity, 'id'>;
type AccountSecurityRow = Pick<Account, 'mfaEnabled'>;
type PasswordKeyRow = Pick<AccountKey, 'id'>;
type PasskeyRow = Pick<AccountPasskey, 'id'>;

async function identityExists(
  db: Surreal,
  provider: string,
  identifier: string,
): Promise<boolean> {
  const [identities] = await db
    .query<[IdentityRow[]]>(
      `
        SELECT id
        FROM account_identity
        WHERE provider = $provider AND identifier = $identifier
        LIMIT 1
      `,
      { provider, identifier },
    )
    .json();

  return identities.length > 0;
}

/** Finds the account linked to a normalized e-mail or username. */
export async function findAccountByIdentity(
  db: Surreal,
  input: unknown,
): Promise<DataManagerResult<AuthenticationAccount | null>> {
  const parsed = parseFindAccountByIdentityInput(input);
  if (!parsed.success) return invalidInput(parsed.issues);

  const [identities] = (await db
    .query<unknown[]>(
      `
        SELECT account
        FROM account_identity
        WHERE provider = $provider AND identifier = $identifier
        LIMIT 1
        FETCH account
      `,
      parsed.output,
    )
    .json()) as [IdentityWithAccount[]];

  return { success: true, data: identities[0]?.account ?? null };
}

/** Creates an account, login identity, and password credential atomically. */
export async function createPasswordAccount(
  db: Surreal,
  input: unknown,
): Promise<DataManagerResult<Pick<Account, 'id'>>> {
  const parsed = parseCreatePasswordAccountInput(input);
  if (!parsed.success) return invalidInput(parsed.issues);

  if (await identityExists(db, parsed.output.provider, parsed.output.identifier)) {
    return conflict('account_identity');
  }

  try {
    const results = await db
      .query<unknown[]>(
        `
          BEGIN TRANSACTION;
          LET $account = CREATE account SET name = $fullName, displayName = $fullName;
          LET $account_id = $account[0].id;
          CREATE account_key SET type = 'password', value = crypto::argon2::generate($password), account = $account_id;
          CREATE account_identity SET provider = $provider, identifier = $identifier, account = $account_id;
          COMMIT TRANSACTION;
        `,
        parsed.output,
      )
      .json();

    const createdIdentities = results[4] as CreatedIdentityRow[] | undefined;
    const candidate = createdIdentities?.[0];

    if (!candidate?.account) {
      throw new Error('SurrealDB did not return the created account ID.');
    }

    return { success: true, data: { id: candidate.account as Account['id'] } };
  } catch (error) {
    if (error instanceof Error && error.message.includes('idx_provider_identifier')) {
      return conflict('account_identity');
    }

    if (await identityExists(db, parsed.output.provider, parsed.output.identifier)) {
      return conflict('account_identity');
    }

    throw error;
  }
}

/** Verifies the password credential associated with an account. */
export async function verifyAccountPassword(
  db: Surreal,
  input: unknown,
): Promise<DataManagerResult<boolean>> {
  const parsed = v.safeParse(VerifyAccountPasswordInputSchema, input);
  if (!parsed.success) return invalidInput(parsed.issues);

  const [keys] = await db
    .query<[PasswordKeyRow[]]>(
      `
        SELECT id
        FROM account_key
        WHERE account = type::record($accountId)
          AND type = 'password'
          AND crypto::argon2::compare(value, $password) = true
        LIMIT 1
      `,
      parsed.output,
    )
    .json();

  return { success: true, data: keys.length > 0 };
}

/** Returns the registered second-factor and passkey capabilities for an account. */
export async function getAccountAuthenticationState(
  db: Surreal,
  input: unknown,
): Promise<DataManagerResult<AccountAuthenticationState | null>> {
  const parsed = v.safeParse(GetAccountAuthenticationStateInputSchema, input);
  if (!parsed.success) return invalidInput(parsed.issues);

  const [accounts, passkeys] = await db
    .query<[AccountSecurityRow[], PasskeyRow[]]>(
      `
        SELECT mfaEnabled
        FROM account
        WHERE id = type::record($accountId)
        LIMIT 1;

        SELECT id
        FROM account_passkey
        WHERE account = type::record($accountId)
        LIMIT 1;
      `,
      parsed.output,
    )
    .json();

  const account = accounts[0];
  if (!account) return { success: true, data: null };

  return {
    success: true,
    data: {
      hasPasskey: passkeys.length > 0,
      mfaEnabled: account.mfaEnabled === true,
    },
  };
}
