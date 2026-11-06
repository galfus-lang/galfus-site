import type { Surreal } from 'surrealdb';

import type { Account, AccountAuthenticator, AccountIdentity } from '../generated';
import { authenticationError, conflict, invalidInput, type DataManagerResult } from '../errors';
import {
  parseCreatePasswordAccountInput,
  parseFindAccountByIdentityInput,
  CreateExternalAccountInputSchema,
  FindAccountByExternalIdentityInputSchema,
  IncrementAccountCredentialVersionInputSchema,
  LinkExternalIdentityInputSchema,
  UnlinkExternalIdentityInputSchema,
  UpsertAccountPasswordInputSchema,
  VerifyAccountPasswordInputSchema,
  GetAccountAuthenticationStateInputSchema,
} from '../inputs/accounts';
import {
  GetAccountProfileInputSchema,
  UpdateAccountProfileInputSchema,
  RemoveAccountAuthenticatorInputSchema,
  DisableAccountMfaInputSchema,
  ActivateDirectTotpAuthenticatorInputSchema,
} from '../inputs/auth-foundation';
import * as v from 'valibot';

export type AuthenticationAccount = Pick<Account, 'id' | 'status' | 'credential_version'>;

/** Read the current account state used to validate access credentials. */
export async function getAccountAccessState(
  db: Surreal,
  input: unknown,
): Promise<DataManagerResult<AuthenticationAccount | null>> {
  const parsed = v.safeParse(GetAccountAuthenticationStateInputSchema, input);
  if (!parsed.success) return invalidInput(parsed.issues);
  const account = await querySingle<AuthenticationAccount>(
    db,
    'SELECT id, status, credential_version FROM account WHERE id = type::record($accountId) LIMIT 1;',
    parsed.output,
  );
  return { success: true, data: account };
}

export interface AccountAuthenticationState {
  hasPasskey: boolean;
  mfaEnabled: boolean;
}

type IdentityWithAccount = Pick<AccountIdentity, 'account'> & {
  account?: AuthenticationAccount;
};

type CreatedIdentityRow = Pick<AccountIdentity, 'account'>;
type IdentityRow = Pick<AccountIdentity, 'id'>;
type AccountSecurityRow = Pick<Account, 'id'>;
type AuthenticatorRow = Pick<AccountAuthenticator, 'id'>;

async function querySingle<T>(
  db: Surreal,
  query: string,
  bindings: Record<string, unknown>,
): Promise<T | null> {
  const [rows] = await db.query<[T[]]>(query, bindings).json();
  return (rows[0] as T | undefined) ?? null;
}

async function identityExists(
  db: Surreal,
  provider: string,
  issuer: string,
  identifier: string,
): Promise<boolean> {
  const [identities] = await db
    .query<[IdentityRow[]]>(
      `
        SELECT id
        FROM account_identity
        WHERE provider = $provider AND issuer = $issuer AND identifier = $identifier
        LIMIT 1
      `,
      { provider, issuer, identifier },
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
        WHERE kind = 'local'
          AND issuer = 'galfus'
          AND provider = $provider
          AND identifier = $identifier
          AND status = 'active'
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

  if (await identityExists(db, parsed.output.provider, 'galfus', parsed.output.identifier)) {
    return conflict('account_identity');
  }

  try {
    const results = await db
      .query<unknown[]>(
        `
          BEGIN TRANSACTION;
          LET $account = CREATE account SET display_name = $fullName;
          LET $account_id = $account[0].id;
          CREATE account_authenticator SET
            account = $account_id,
            kind = 'password',
            purpose = 'primary',
            status = 'active',
            secret_hash = crypto::argon2::generate($password),
            verified_at = time::now();
          CREATE account_identity SET
            kind = 'local',
            provider = $provider,
            issuer = 'galfus',
            identifier = $identifier,
            account = $account_id;
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
    if (error instanceof Error && error.message.includes('idx_provider_issuer_identifier')) {
      return conflict('account_identity');
    }

    if (await identityExists(db, parsed.output.provider, 'galfus', parsed.output.identifier)) {
      return conflict('account_identity');
    }

    throw error;
  }
}

/** Finds a global account from an already verified external provider subject. */
export async function findAccountByExternalIdentity(
  db: Surreal,
  input: unknown,
): Promise<DataManagerResult<AuthenticationAccount | null>> {
  const parsed = v.safeParse(FindAccountByExternalIdentityInputSchema, input);
  if (!parsed.success) return invalidInput(parsed.issues);

  const [identities] = (await db
    .query<unknown[]>(
      `
        SELECT account
        FROM account_identity
        WHERE kind = 'external'
          AND provider = $provider
          AND issuer = $issuer
          AND identifier = $subject
          AND status = 'active'
        LIMIT 1
        FETCH account
      `,
      parsed.output,
    )
    .json()) as [IdentityWithAccount[]];

  return { success: true, data: identities[0]?.account ?? null };
}

/** Creates a global account from an external identity after protocol verification at the server boundary. */
export async function createExternalAccount(
  db: Surreal,
  input: unknown,
): Promise<DataManagerResult<Pick<Account, 'id'>>> {
  const parsed = v.safeParse(CreateExternalAccountInputSchema, input);
  if (!parsed.success) return invalidInput(parsed.issues);

  const output = parsed.output;
  if (await identityExists(db, output.provider, output.issuer, output.subject)) {
    return conflict('account_identity');
  }

  try {
    const results = await db
      .query<unknown[]>(
        `
          BEGIN TRANSACTION;
          LET $account = CREATE account SET display_name = $fullName;
          LET $account_id = $account[0].id;
          CREATE account_identity SET
            kind = 'external',
            provider = $provider,
            issuer = $issuer,
            identifier = $subject,
            metadata = $metadata,
            account = $account_id,
            verified_at = time::now();
          COMMIT TRANSACTION;
        `,
        output,
      )
      .json();
    const createdIdentities = results[3] as CreatedIdentityRow[] | undefined;
    const candidate = createdIdentities?.[0];
    if (!candidate?.account) throw new Error('SurrealDB did not create the external account ID.');
    return { success: true, data: { id: candidate.account as Account['id'] } };
  } catch (error) {
    if (error instanceof Error && error.message.includes('idx_provider_issuer_identifier')) {
      return conflict('account_identity');
    }
    if (await identityExists(db, output.provider, output.issuer, output.subject)) {
      return conflict('account_identity');
    }
    throw error;
  }
}

/** Links an externally verified subject to an existing active global account. */
export async function linkExternalIdentity(
  db: Surreal,
  input: unknown,
): Promise<DataManagerResult<AccountIdentity>> {
  const parsed = v.safeParse(LinkExternalIdentityInputSchema, input);
  if (!parsed.success) return invalidInput(parsed.issues);

  const output = parsed.output;
  try {
    const results = await db
      .query<unknown[]>(
        `
          BEGIN TRANSACTION;
          LET $account = (
            SELECT id FROM account
            WHERE id = type::record($accountId) AND status = 'active'
            LIMIT 1
          )[0];
          LET $identity = IF $account IS NONE THEN NONE ELSE (
            CREATE account_identity SET
              kind = 'external',
              provider = $provider,
              issuer = $issuer,
              identifier = $subject,
              metadata = $metadata,
              account = $account.id,
              verified_at = time::now()
          )[0] END;
          COMMIT TRANSACTION;
          RETURN $identity;
        `,
        output,
      )
      .json();
    const identity = results.at(-1) as AccountIdentity | null | undefined;
    if (!identity) return authenticationError('error.auth.account.invalid');
    return { success: true, data: identity };
  } catch (error) {
    if (error instanceof Error && error.message.includes('idx_provider_issuer_identifier')) {
      return conflict('account_identity');
    }
    throw error;
  }
}

/** Removes an external identity only when another login method remains active. */
export async function unlinkExternalIdentity(
  db: Surreal,
  input: unknown,
): Promise<DataManagerResult<boolean>> {
  const parsed = v.safeParse(UnlinkExternalIdentityInputSchema, input);
  if (!parsed.success) return invalidInput(parsed.issues);

  const results = await db
    .query<unknown[]>(
      `
        BEGIN TRANSACTION;
        LET $identity = (
          SELECT id FROM account_identity
          WHERE account = type::record($accountId)
            AND kind = 'external'
            AND provider = $provider
            AND issuer = $issuer
            AND identifier = $subject
            AND status = 'active'
          LIMIT 1
        )[0];
        LET $remainingIdentity = IF $identity IS NONE THEN NONE ELSE (
          SELECT id FROM account_identity
          WHERE account = type::record($accountId) AND status = 'active' AND id != $identity.id
          LIMIT 1
        )[0] END;
        LET $primaryAuthenticator = IF $identity IS NONE THEN NONE ELSE (
          SELECT id FROM account_authenticator
          WHERE account = type::record($accountId) AND purpose = 'primary' AND status = 'active'
          LIMIT 1
        )[0] END;
        LET $removed = IF $remainingIdentity IS NONE AND $primaryAuthenticator IS NONE THEN NONE ELSE (
          DELETE $identity.id RETURN BEFORE
        )[0] END;
        COMMIT TRANSACTION;
        RETURN $removed;
      `,
      parsed.output,
    )
    .json();
  const deleted = results.at(-1) as IdentityRow | null | undefined;
  return { success: true, data: Boolean(deleted) };
}

/** Invalidates stateless credentials by incrementing the account security version. */
export async function incrementAccountCredentialVersion(
  db: Surreal,
  input: unknown,
): Promise<DataManagerResult<Pick<Account, 'id' | 'credential_version'>>> {
  const parsed = v.safeParse(IncrementAccountCredentialVersionInputSchema, input);
  if (!parsed.success) return invalidInput(parsed.issues);

  const account = await querySingle<Pick<Account, 'id' | 'credential_version'>>(
    db,
    `
      UPDATE type::record($accountId)
      SET credential_version = credential_version + 1
      WHERE status = 'active'
      RETURN AFTER;
    `,
    parsed.output,
  );
  return account
    ? { success: true, data: account }
    : authenticationError('error.auth.account.invalid');
}

/** Creates or replaces the primary password and invalidates prior stateless credentials. */
export async function upsertAccountPassword(
  db: Surreal,
  input: unknown,
): Promise<DataManagerResult<AccountAuthenticator>> {
  const parsed = v.safeParse(UpsertAccountPasswordInputSchema, input);
  if (!parsed.success) return invalidInput(parsed.issues);

  const results = await db
    .query<unknown[]>(
      `
        BEGIN TRANSACTION;
        LET $account = (
          SELECT id FROM account WHERE id = type::record($accountId) AND status = 'active' LIMIT 1
        )[0];
        LET $existing = IF $account IS NONE THEN NONE ELSE (
          SELECT id FROM account_authenticator
          WHERE account = $account.id AND kind = 'password' AND purpose = 'primary'
          LIMIT 1
        )[0] END;
        LET $passwordAuthenticator = IF $account IS NONE THEN NONE ELSE IF $existing IS NONE THEN (
          CREATE account_authenticator SET
            account = $account.id,
            kind = 'password',
            purpose = 'primary',
            status = 'active',
            secret_hash = crypto::argon2::generate($password),
            verified_at = time::now()
        )[0] ELSE (
          UPDATE $existing.id
          SET status = 'active',
            disabled_at = NONE,
            secret_hash = crypto::argon2::generate($password),
            verified_at = time::now()
          RETURN AFTER
        )[0] END;
        IF $passwordAuthenticator IS NOT NONE THEN (
          UPDATE $account.id SET credential_version = credential_version + 1
        ) END;
        IF $passwordAuthenticator IS NOT NONE THEN (
          UPDATE auth_transaction SET status = 'revoked'
          WHERE account = $account.id AND kind IN ['upsert_password', 'password_recovery']
            AND consumed_at IS NONE AND status IN ['pending', 'awaiting_primary', 'authorized']
        ) END;
        COMMIT TRANSACTION;
        RETURN $passwordAuthenticator;
      `,
      parsed.output,
    )
    .json();
  const authenticator = results.at(-1) as AccountAuthenticator | null | undefined;
  return authenticator
    ? { success: true, data: authenticator }
    : authenticationError('error.auth.account.invalid');
}

/** Verifies the password credential associated with an account. */
export async function verifyAccountPassword(
  db: Surreal,
  input: unknown,
): Promise<DataManagerResult<boolean>> {
  const parsed = v.safeParse(VerifyAccountPasswordInputSchema, input);
  if (!parsed.success) return invalidInput(parsed.issues);

  const [accounts, authenticators] = await db
    .query<[AccountSecurityRow[], AuthenticatorRow[]]>(
      `
        SELECT id
        FROM account
        WHERE id = type::record($accountId) AND status = 'active'
        LIMIT 1;

        SELECT id
        FROM account_authenticator
        WHERE account = type::record($accountId)
          AND kind = 'password'
          AND purpose = 'primary'
          AND status = 'active'
          AND crypto::argon2::compare(secret_hash, $password) = true
        LIMIT 1
      `,
      parsed.output,
    )
    .json();

  return { success: true, data: accounts.length > 0 && authenticators.length > 0 };
}

/** Returns the registered second-factor and passkey capabilities for an account. */
export async function getAccountAuthenticationState(
  db: Surreal,
  input: unknown,
): Promise<DataManagerResult<AccountAuthenticationState | null>> {
  const parsed = v.safeParse(GetAccountAuthenticationStateInputSchema, input);
  if (!parsed.success) return invalidInput(parsed.issues);

  const [accounts, passkeys, mfaAuthenticators] = await db
    .query<[AccountSecurityRow[], AuthenticatorRow[], AuthenticatorRow[]]>(
      `
        SELECT id
        FROM account
        WHERE id = type::record($accountId) AND status = 'active'
        LIMIT 1;

        SELECT id
        FROM account_authenticator
        WHERE account = type::record($accountId)
          AND kind = 'passkey'
          AND purpose = 'primary'
          AND status = 'active'
        LIMIT 1;

        SELECT id
        FROM account_authenticator
        WHERE account = type::record($accountId)
          AND purpose = 'mfa'
          AND status = 'active'
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
      mfaEnabled: mfaAuthenticators.length > 0,
    },
  };
}

export interface AccountProfileData {
  account: {
    id: string;
    displayName: string;
    status: string;
    credentialVersion: number;
    createdAt: Date;
  };
  identities: Array<{
    id: string;
    kind: string;
    provider: string;
    identifier: string;
    status: string;
    createdAt: Date;
  }>;
  security: {
    hasPassword: boolean;
    passkeys: Array<{
      id: string;
      credentialId: string;
      label?: string;
      deviceType?: string;
      backedUp?: boolean;
      createdAt: Date;
    }>;
    mfa: {
      enabled: boolean;
      kind?: string;
    };
  };
}

export async function getAccountProfile(
  db: Surreal,
  input: unknown,
): Promise<DataManagerResult<AccountProfileData | null>> {
  const parsed = v.safeParse(GetAccountProfileInputSchema, input);
  if (!parsed.success) return invalidInput(parsed.issues);

  const [accounts, identities, authenticators] = await db
    .query<
      [
        Array<{
          id: unknown;
          display_name: string;
          status: string;
          credential_version: number;
          created_at: string;
        }>,
        Array<{
          id: unknown;
          kind: string;
          provider: string;
          identifier: string;
          status: string;
          created_at: string;
        }>,
        Array<{
          id: unknown;
          kind: string;
          purpose: string;
          status: string;
          identifier?: string;
          metadata?: {
            label?: string;
            device_type?: string;
            backed_up?: boolean;
          };
          created_at: string;
        }>,
      ]
    >(
      `
        SELECT id, display_name, status, credential_version, created_at
        FROM account
        WHERE id = type::record($accountId) AND status = 'active'
        LIMIT 1;

        SELECT id, kind, provider, identifier, status, created_at
        FROM account_identity
        WHERE account = type::record($accountId) AND status = 'active'
        ORDER BY created_at ASC;

        SELECT id, kind, purpose, status, identifier, metadata, created_at
        FROM account_authenticator
        WHERE account = type::record($accountId) AND status = 'active';
      `,
      parsed.output,
    )
    .json();

  const account = accounts[0];
  if (!account) return { success: true, data: null };

  const hasPassword = authenticators.some((a) => a.kind === 'password' && a.purpose === 'primary');
  const passkeys = authenticators
    .filter((a) => a.kind === 'passkey' && a.purpose === 'primary' && a.identifier)
    .map((a) => ({
      id: a.id ? a.id.toString() : '',
      credentialId: a.identifier!,
      label: a.metadata?.label,
      deviceType: a.metadata?.device_type,
      backedUp: a.metadata?.backed_up,
      createdAt: new Date(a.created_at),
    }));

  const mfaAuth = authenticators.find((a) => a.purpose === 'mfa');

  return {
    success: true,
    data: {
      account: {
        id: account.id ? account.id.toString() : '',
        displayName: account.display_name,
        status: account.status,
        credentialVersion: account.credential_version,
        createdAt: new Date(account.created_at),
      },
      identities: identities.map((i) => ({
        id: i.id ? i.id.toString() : '',
        kind: i.kind,
        provider: i.provider,
        identifier: i.identifier,
        status: i.status,
        createdAt: new Date(i.created_at),
      })),
      security: {
        hasPassword,
        passkeys,
        mfa: {
          enabled: Boolean(mfaAuth),
          kind: mfaAuth?.kind,
        },
      },
    },
  };
}

export async function updateAccountProfile(
  db: Surreal,
  input: unknown,
): Promise<DataManagerResult<{ id: string; displayName: string }>> {
  const parsed = v.safeParse(UpdateAccountProfileInputSchema, input);
  if (!parsed.success) return invalidInput(parsed.issues);

  const results = await db
    .query<[{ id: unknown; display_name: string }[]]>(
      `
        UPDATE type::record($accountId)
        SET display_name = $displayName
        WHERE status = 'active'
        RETURN id, display_name;
      `,
      parsed.output,
    )
    .json();

  const updated = results[0]?.[0];
  if (!updated) return authenticationError('error.auth.account.invalid');

  return {
    success: true,
    data: {
      id: updated.id ? updated.id.toString() : '',
      displayName: updated.display_name,
    },
  };
}

export async function removeAccountAuthenticator(
  db: Surreal,
  input: unknown,
): Promise<DataManagerResult<boolean>> {
  const parsed = v.safeParse(RemoveAccountAuthenticatorInputSchema, input);
  if (!parsed.success) return invalidInput(parsed.issues);

  const [deleted] = await db
    .query<[Pick<AccountAuthenticator, 'id'>[]]>(
      `DELETE account_authenticator
        WHERE id = type::record($authenticatorId)
          AND account = type::record($accountId)
          AND kind = 'passkey' AND purpose = 'primary'
        RETURN BEFORE;`,
      parsed.output,
    )
    .json();

  return { success: true, data: deleted.length > 0 };
}

export async function disableAccountMfa(
  db: Surreal,
  input: unknown,
): Promise<DataManagerResult<boolean>> {
  const parsed = v.safeParse(DisableAccountMfaInputSchema, input);
  if (!parsed.success) return invalidInput(parsed.issues);

  const results = await db
    .query<unknown[]>(
      `
      BEGIN TRANSACTION;
      LET $verified = (UPDATE type::record($authenticatorId)
        SET metadata.last_used_at = $stepTime
        WHERE account = type::record($accountId) AND kind = 'totp' AND purpose = 'mfa'
          AND status = 'active'
          AND (metadata.last_used_at IS NONE OR metadata.last_used_at < $stepTime)
        RETURN AFTER)[0];
      LET $account = IF $verified IS NONE THEN NONE ELSE (UPDATE type::record($accountId)
        SET credential_version = credential_version + 1
        WHERE status = 'active' AND credential_version = $credentialVersion RETURN AFTER)[0] END;
      IF $account IS NOT NONE THEN (
        DELETE account_authenticator WHERE account = type::record($accountId)
          AND (purpose = 'mfa' OR purpose = 'recovery')
      ) END;
      COMMIT TRANSACTION;
      RETURN $account IS NOT NONE;
      `,
      { ...parsed.output, stepTime: new Date(parsed.output.verifiedStep * 30_000) },
    )
    .json();

  return { success: true, data: results.at(-1) === true };
}

export async function activateDirectTotpAuthenticator(
  db: Surreal,
  input: unknown,
): Promise<DataManagerResult<boolean>> {
  const parsed = v.safeParse(ActivateDirectTotpAuthenticatorInputSchema, input);
  if (!parsed.success) return invalidInput(parsed.issues);

  const results = await db
    .query<unknown[]>(
      `
      BEGIN TRANSACTION;
      LET $existing = (SELECT id FROM account_authenticator
        WHERE account = type::record($accountId) AND purpose = 'mfa' AND status = 'active' LIMIT 1)[0];
      LET $account = IF $existing IS NOT NONE THEN NONE ELSE (UPDATE type::record($accountId)
        SET credential_version = credential_version + 1
        WHERE status = 'active' AND credential_version = $credentialVersion RETURN AFTER)[0] END;
      IF $account IS NOT NONE THEN (DELETE account_authenticator
        WHERE account = type::record($accountId) AND purpose = 'recovery') END;
      IF $account IS NOT NONE THEN (CREATE type::record('account_authenticator', $authenticatorId) CONTENT {
        account: type::record($accountId),
        kind: 'totp',
        purpose: 'mfa',
        status: 'active',
        secret_ciphertext: $secretCiphertext,
        metadata: { last_used_at: $stepTime },
        verified_at: time::now()
      }) END;

      FOR $code IN $codes {
        IF $account IS NOT NONE THEN (CREATE type::record('account_authenticator', $code.id) CONTENT {
          account: type::record($accountId),
          kind: 'recovery_code',
          purpose: 'recovery',
          status: 'active',
          secret_hash: $code.secretHash,
          verified_at: time::now()
        }) END;
      };
      COMMIT TRANSACTION;
      RETURN $account IS NOT NONE;
    `,
      { ...parsed.output, stepTime: new Date(parsed.output.verifiedStep * 30_000) },
    )
    .json();

  return { success: true, data: results.at(-1) === true };
}
