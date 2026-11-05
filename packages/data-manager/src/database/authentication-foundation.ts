import type { Surreal } from 'surrealdb';
import { RecordId, TextCodec } from 'surrealdb';
import * as v from 'valibot';

import type { AuthOtpChallenge, AuthTransaction, BelongsTo } from '../generated';
import { authenticationError, invalidInput, type DataManagerResult } from '../errors';
import {
  type AuthTransactionKind,
  type AuthTransactionMetadata,
  AuthorizeOrganizationInvitationSsoInputSchema,
  AuthorizeExternalProviderRegistrationInputSchema,
  AuthorizeRegistrationAuthTransactionInputSchema,
  CompleteAuthTransactionInputSchema,
  CompleteExternalProviderAuthTransactionInputSchema,
  CompleteExternalProviderLinkInputSchema,
  CompleteOrganizationInvitationInputSchema,
  ConfirmTotpAuthTransactionInputSchema,
  ConfirmRecoveryCodeAuthTransactionInputSchema,
  ConfirmOtpAuthTransactionInputSchema,
  ConfirmPasswordAuthTransactionInputSchema,
  ConsumeOtpChallengeInputSchema,
  CreateOrganizationInvitationTransactionInputSchema,
  CreateOtpChallengeInputSchema,
  EnforceOrganizationSsoInputSchema,
  GetAuthTransactionInputSchema,
  GetRedeemableOrganizationInvitationInputSchema,
  PurgeExpiredAuthTransactionsInputSchema,
  RedeemOrganizationInvitationInputSchema,
  RevokeMembershipFromWebhookInputSchema,
  RevokeOrganizationInvitationTransactionInputSchema,
  RevokeOrganizationAccessInputSchema,
  StartAuthTransactionInputSchema,
  parseStartIdentityAuthTransactionInput,
  StartExternalProviderAuthTransactionInputSchema,
  StartPasswordRecoveryTransactionInputSchema,
  CompleteUpsertPasswordTransactionInputSchema,
  SetPasskeyAuthTransactionChallengeInputSchema,
  AuthorizePasskeyAuthTransactionInputSchema,
  VerifyOrganizationMembershipSsoInputSchema,
} from '../inputs/auth-foundation';

type AuthTransactionViewBase = Omit<
  Pick<
    AuthTransaction,
    | 'id'
    | 'status'
    | 'account'
    | 'organization'
    | 'parent'
    | 'return_to'
    | 'attempts'
    | 'max_attempts'
    | 'expires_at'
    | 'consumed_at'
    | 'version'
  >,
  'metadata'
>;

export type AuthTransactionView<K extends AuthTransactionKind = AuthTransactionKind> =
  K extends AuthTransactionKind
    ? AuthTransactionViewBase & {
        kind: K;
        metadata: AuthTransactionMetadata<K>;
      }
    : never;

export interface RedeemableOrganizationInvitation {
  id: AuthTransaction['id'];
  organization?: AuthTransaction['organization'];
  ssoConnection?: RecordId<'organization_sso_connection'>;
  role: string;
  targetEmail?: string;
  expiresAt: Date;
  status: string;
}

export type CompletedAuthTransaction = Pick<
  AuthTransaction,
  'id' | 'account' | 'status' | 'return_to' | 'consumed_at' | 'version'
>;

export interface PurgedAuthTransactions {
  otpChallenges: number;
  transactions: number;
}

export interface StartedIdentityAuthTransaction {
  nextRoute: '/challenge' | '/register';
  transaction: AuthTransactionView<'authorization' | 'registration'>;
}

function recordId<T extends string>(table: T, id: string): RecordId<T> {
  if (id.startsWith(`${table}:`)) {
    const parsed = TextCodec.parseRecordId(id);
    if (parsed.table.name !== table) {
      throw new Error(`Expected a ${table} record ID.`);
    }
    return parsed as RecordId<T>;
  }
  return new RecordId(table, id);
}

function optionalRecordId<T extends string>(table: T, id?: string | null): RecordId<T> | undefined {
  return id ? recordId(table, id) : undefined;
}

function asDate(value: string): Date {
  return new Date(value);
}

function hasAllowedExpiry(value: string, maximumDurationMs: number): boolean {
  const expiresAt = asDate(value).getTime();
  const now = Date.now();
  return Number.isFinite(expiresAt) && expiresAt > now && expiresAt <= now + maximumDurationMs;
}

const AUTH_TRANSACTION_MAX_DURATION_MS = 15 * 60 * 1_000;
const AUTH_OTP_MAX_DURATION_MS = 15 * 60 * 1_000;
const ORGANIZATION_INVITATION_MAX_DURATION_MS = 7 * 24 * 60 * 60 * 1_000;

function transactionRecordId(id: string): RecordId<'auth_transaction'> {
  return recordId('auth_transaction', id);
}

async function querySingle<T>(
  db: Surreal,
  query: string,
  bindings: Record<string, unknown>,
): Promise<T | null> {
  const [rows] = await db.query<[T[]]>(query, bindings).json();
  return (rows[0] as T | undefined) ?? null;
}

function transactionErrorForStatus(status: string): DataManagerResult<never> {
  return authenticationError(
    status === 'expired' ? 'error.auth.transaction.expired' : 'error.auth.transaction.invalid',
  );
}

/** Creates the persisted half of a browser-bound opaque authorization transaction. */
export async function startAuthTransaction(
  db: Surreal,
  input: unknown,
): Promise<DataManagerResult<AuthTransactionView>> {
  const parsed = v.safeParse(StartAuthTransactionInputSchema, input);
  if (!parsed.success) return invalidInput(parsed.issues);
  if (!hasAllowedExpiry(parsed.output.expiresAt, AUTH_TRANSACTION_MAX_DURATION_MS)) {
    return authenticationError('error.auth.transaction.invalid');
  }

  const output = parsed.output;
  const account = optionalRecordId('account', output.accountId);

  const content = {
    kind: output.kind,
    status: 'pending',
    browser_verifier_hash: output.browserVerifierHash,
    expires_at: asDate(output.expiresAt),
    ...(account && {
      account,
    }),
    ...(output.returnTo ? { return_to: output.returnTo } : {}),
  };

  const transaction = await querySingle<AuthTransactionView>(
    db,
    "CREATE type::record('auth_transaction', $transactionId) CONTENT $content RETURN AFTER;",
    { transactionId: output.id, content },
  );

  if (!transaction) throw new Error('SurrealDB did not create the authorization transaction.');
  return { success: true, data: transaction };
}

/**
 * Resolves a normalized local identity and starts its browser-bound journey in
 * one database transaction. The caller receives no account-existence detail.
 */
export async function startIdentityAuthTransaction(
  db: Surreal,
  input: unknown,
): Promise<DataManagerResult<StartedIdentityAuthTransaction>> {
  const parsed = parseStartIdentityAuthTransactionInput(input);
  if (!parsed.success) return invalidInput(parsed.issues);
  if (!hasAllowedExpiry(parsed.output.expiresAt, AUTH_TRANSACTION_MAX_DURATION_MS)) {
    return authenticationError('error.auth.transaction.invalid');
  }

  const output = parsed.output;
  const returnToField = output.returnTo ? 'return_to: $returnTo,' : '';
  const results = await db
    .query<unknown[]>(
      `
        BEGIN TRANSACTION;
        LET $identity = (
          SELECT account
          FROM account_identity
          WHERE kind = 'local'
            AND issuer = 'galfus'
            AND provider = $provider
            AND identifier = $identifier
            AND status = 'active'
          LIMIT 1
          FETCH account
        )[0];
        LET $account = IF $identity IS NONE THEN NONE ELSE $identity.account END;
        LET $transaction = IF $account IS NONE THEN (
          CREATE type::record('auth_transaction', $transactionId) CONTENT {
            kind: 'registration',
            status: 'awaiting_primary',
            browser_verifier_hash: $browserVerifierHash,
            expires_at: $expiresAt,
            metadata: {
              registration: {
                provider: $provider,
                identifier: $identifier,
              },
            },
            ${returnToField}
          }
        )[0] ELSE IF $account.status = 'active' THEN (
          CREATE type::record('auth_transaction', $transactionId) CONTENT {
            kind: 'authorization',
            status: 'awaiting_primary',
            account: $account.id,
            browser_verifier_hash: $browserVerifierHash,
            expires_at: $expiresAt,
            metadata: {
              authorization: {
                provider: $provider,
                identifier: $identifier,
              },
            },
            ${returnToField}
          }
        )[0] ELSE NONE END;
        COMMIT TRANSACTION;
        RETURN { account_status: $account.status, transaction: $transaction };
      `,
      {
        transactionId: output.id,
        browserVerifierHash: output.browserVerifierHash,
        provider: output.provider,
        identifier: output.identifier,
        expiresAt: asDate(output.expiresAt),
        ...(output.returnTo ? { returnTo: output.returnTo } : {}),
      },
    )
    .json();

  const result = results.at(-1) as
    | {
        account_status?: string;
        transaction?: AuthTransactionView<'authorization' | 'registration'>;
      }
    | undefined;
  if (result?.transaction) {
    return {
      success: true,
      data: {
        nextRoute: result.transaction.kind === 'authorization' ? '/challenge' : '/register',
        transaction: result.transaction,
      },
    };
  }
  if (result?.account_status === 'suspended' || result?.account_status === 'disabled') {
    return authenticationError('error.auth.account.blocked');
  }

  throw new Error('SurrealDB did not create an identity authentication transaction.');
}

/**
 * Starts a browser-bound external sign-in journey. The caller persists the raw
 * state, nonce, and PKCE verifier only as needed for its provider redirect.
 */
export async function startExternalProviderAuthTransaction(
  db: Surreal,
  input: unknown,
): Promise<DataManagerResult<AuthTransactionView<'authorization'>>> {
  const parsed = v.safeParse(StartExternalProviderAuthTransactionInputSchema, input);
  if (!parsed.success) return invalidInput(parsed.issues);
  if (!hasAllowedExpiry(parsed.output.expiresAt, AUTH_TRANSACTION_MAX_DURATION_MS)) {
    return authenticationError('error.auth.transaction.invalid');
  }

  const output = parsed.output;
  const account = optionalRecordId('account', output.accountId);
  if (output.mode === 'link' && account) {
    const activeAccount = await querySingle<{ id: RecordId<'account'> }>(
      db,
      "SELECT id FROM $account WHERE status = 'active' LIMIT 1;",
      { account },
    );
    if (!activeAccount) return authenticationError('error.auth.account.invalid');
  }

  const transaction = await querySingle<AuthTransactionView<'authorization'>>(
    db,
    "CREATE type::record('auth_transaction', $transactionId) CONTENT $content RETURN AFTER;",
    {
      transactionId: output.id,
      content: {
        kind: 'authorization',
        status: 'awaiting_provider',
        browser_verifier_hash: output.browserVerifierHash,
        expires_at: asDate(output.expiresAt),
        ...(account ? { account } : {}),
        ...(output.returnTo ? { return_to: output.returnTo } : {}),
        metadata: {
          authorization: {
            external_provider: {
              provider: output.provider,
              issuer: output.issuer,
              protocol: output.protocol,
              mode: output.mode,
              state_hash: output.stateHash,
              ...(output.nonceHash ? { nonce_hash: output.nonceHash } : {}),
              ...(output.nonceCiphertext ? { nonce_ciphertext: output.nonceCiphertext } : {}),
              ...(output.pkceVerifierCiphertext
                ? { pkce_verifier_ciphertext: output.pkceVerifierCiphertext }
                : {}),
            },
          },
        },
      },
    },
  );
  if (!transaction)
    throw new Error('SurrealDB did not create the external authorization transaction.');
  return { success: true, data: transaction };
}

/**
 * Resolves a verified external identity for sign-in. Unknown identities remain
 * transaction-bound in awaiting_registration until an account is created.
 */
export async function completeExternalProviderAuthentication(
  db: Surreal,
  input: unknown,
): Promise<DataManagerResult<AuthTransactionView<'authorization'>>> {
  const parsed = v.safeParse(CompleteExternalProviderAuthTransactionInputSchema, input);
  if (!parsed.success) return invalidInput(parsed.issues);

  const output = parsed.output;
  const results = await db
    .query<unknown[]>(
      `
        BEGIN TRANSACTION;
        LET $transaction = (
          SELECT id FROM $transactionRecord
          WHERE kind = 'authorization'
            AND status = 'awaiting_provider'
            AND version = $expectedVersion
            AND browser_verifier_hash = $browserVerifierHash
            AND expires_at > time::now()
            AND consumed_at IS NONE
            AND metadata.authorization.external_provider.mode = 'sign_in'
            AND metadata.authorization.external_provider.provider = $provider
            AND metadata.authorization.external_provider.issuer = $issuer
            AND metadata.authorization.external_provider.state_hash = $stateHash
          LIMIT 1
        )[0];
        LET $identity = IF $transaction IS NONE THEN NONE ELSE (
          SELECT account FROM account_identity
          WHERE kind = 'external'
            AND provider = $provider
            AND issuer = $issuer
            AND identifier = $subject
            AND status = 'active'
          LIMIT 1
          FETCH account
        )[0] END;
        LET $mfaAuthenticator = IF $identity IS NONE OR $identity.account.status != 'active' THEN NONE ELSE (
          SELECT kind FROM account_authenticator
          WHERE account = $identity.account.id AND purpose = 'mfa' AND status = 'active'
          LIMIT 1
        )[0] END;
        LET $completed = IF $transaction IS NONE THEN NONE ELSE IF $identity IS NONE THEN (
          UPDATE $transaction.id
          SET metadata.authorization.external_provider.subject = $subject,
            metadata.authorization.external_provider.profile = $profile,
            status = 'awaiting_registration',
            version = version + 1
          RETURN AFTER
        )[0] ELSE IF $identity.account.status = 'active' THEN (
          UPDATE $transaction.id
          SET account = $identity.account.id,
            metadata.authorization.primary_method = 'external_provider',
            metadata.authorization.pending_mfa_method = $mfaAuthenticator.kind,
            metadata.authorization.external_provider.subject = $subject,
            metadata.authorization.external_provider.profile = $profile,
            status = IF $mfaAuthenticator IS NONE THEN 'authorized' ELSE 'awaiting_mfa' END,
            version = version + 1
          RETURN AFTER
        )[0] ELSE NONE END;
        COMMIT TRANSACTION;
        RETURN $completed;
      `,
      {
        transactionRecord: transactionRecordId(output.id),
        browserVerifierHash: output.browserVerifierHash,
        expectedVersion: output.expectedVersion,
        stateHash: output.stateHash,
        provider: output.provider,
        issuer: output.issuer,
        subject: output.subject,
        profile: output.profile,
      },
    )
    .json();
  const transaction = results.at(-1) as AuthTransactionView<'authorization'> | null | undefined;
  return transaction
    ? { success: true, data: transaction }
    : authenticationError('error.auth.transaction.state_conflict');
}

/**
 * Links a verified provider subject to the account bound when the link journey
 * started. The calling server must authenticate that account before it creates
 * this transaction; the transaction itself is not a session credential.
 */
export async function completeExternalProviderLink(
  db: Surreal,
  input: unknown,
): Promise<DataManagerResult<AuthTransactionView<'authorization'>>> {
  const parsed = v.safeParse(CompleteExternalProviderLinkInputSchema, input);
  if (!parsed.success) return invalidInput(parsed.issues);

  const output = parsed.output;
  const results = await db
    .query<unknown[]>(
      `
        BEGIN TRANSACTION;
        LET $transaction = (
          SELECT id, account FROM $transactionRecord
          WHERE kind = 'authorization'
            AND status = 'awaiting_provider'
            AND version = $expectedVersion
            AND browser_verifier_hash = $browserVerifierHash
            AND expires_at > time::now()
            AND consumed_at IS NONE
            AND metadata.authorization.external_provider.mode = 'link'
            AND metadata.authorization.external_provider.provider = $provider
            AND metadata.authorization.external_provider.issuer = $issuer
            AND metadata.authorization.external_provider.state_hash = $stateHash
          LIMIT 1
          FETCH account
        )[0];
        LET $existingIdentity = IF $transaction IS NONE OR $transaction.account.status != 'active' THEN NONE ELSE (
          SELECT id, account FROM account_identity
          WHERE kind = 'external'
            AND provider = $provider
            AND issuer = $issuer
            AND identifier = $subject
            AND status = 'active'
          LIMIT 1
        )[0] END;
        LET $identity = IF $transaction IS NONE OR $transaction.account.status != 'active' THEN NONE
          ELSE IF $existingIdentity IS NONE THEN (
            CREATE account_identity SET
              kind = 'external',
              provider = $provider,
              issuer = $issuer,
              identifier = $subject,
              metadata = $profile,
              account = $transaction.account.id,
              verified_at = time::now()
          )[0]
          ELSE IF $existingIdentity.account = $transaction.account.id THEN $existingIdentity
          ELSE NONE END;
        LET $completed = IF $identity IS NONE THEN NONE ELSE (
          UPDATE $transaction.id
          SET metadata.authorization.primary_method = 'external_provider',
            metadata.authorization.external_provider.subject = $subject,
            metadata.authorization.external_provider.profile = $profile,
            status = 'authorized',
            version = version + 1
          RETURN AFTER
        )[0] END;
        COMMIT TRANSACTION;
        RETURN $completed;
      `,
      {
        transactionRecord: transactionRecordId(output.id),
        browserVerifierHash: output.browserVerifierHash,
        expectedVersion: output.expectedVersion,
        stateHash: output.stateHash,
        provider: output.provider,
        issuer: output.issuer,
        subject: output.subject,
        profile: output.profile,
      },
    )
    .json();
  const transaction = results.at(-1) as AuthTransactionView<'authorization'> | null | undefined;
  return transaction
    ? { success: true, data: transaction }
    : authenticationError('error.auth.transaction.state_conflict');
}

/** Authorizes an account created from the same verified external transaction subject. */
export async function authorizeExternalProviderRegistration(
  db: Surreal,
  input: unknown,
): Promise<DataManagerResult<AuthTransactionView<'authorization'>>> {
  const parsed = v.safeParse(AuthorizeExternalProviderRegistrationInputSchema, input);
  if (!parsed.success) return invalidInput(parsed.issues);

  const output = parsed.output;
  const results = await db
    .query<unknown[]>(
      `
        BEGIN TRANSACTION;
        LET $currentTransaction = (
          SELECT id, metadata FROM $transaction
          WHERE kind = 'authorization'
            AND status = 'awaiting_registration'
            AND version = $expectedVersion
            AND browser_verifier_hash = $browserVerifierHash
            AND expires_at > time::now()
            AND consumed_at IS NONE
          LIMIT 1
        )[0];
        LET $identity = IF $currentTransaction IS NONE THEN NONE ELSE (
          SELECT id FROM account_identity
          WHERE account = $account
            AND kind = 'external'
            AND provider = $currentTransaction.metadata.authorization.external_provider.provider
            AND issuer = $currentTransaction.metadata.authorization.external_provider.issuer
            AND identifier = $currentTransaction.metadata.authorization.external_provider.subject
            AND status = 'active'
          LIMIT 1
        )[0] END;
        LET $mfaAuthenticator = IF $identity IS NONE THEN NONE ELSE (
          SELECT kind FROM account_authenticator
          WHERE account = $account AND purpose = 'mfa' AND status = 'active'
          LIMIT 1
        )[0];
        LET $transactionUpdate = IF $identity IS NONE THEN NONE ELSE (
          UPDATE $currentTransaction.id
          SET account = $account,
            metadata.authorization.primary_method = 'external_provider',
            status = IF $mfaAuthenticator IS NONE THEN 'authorized' ELSE 'awaiting_mfa' END,
            metadata.authorization.pending_mfa_method = $mfaAuthenticator.kind,
            version = version + 1
          RETURN AFTER
        )[0];
        COMMIT TRANSACTION;
        RETURN $transactionUpdate;
      `,
      {
        transaction: transactionRecordId(output.id),
        account: recordId('account', output.accountId),
        browserVerifierHash: output.browserVerifierHash,
        expectedVersion: output.expectedVersion,
      },
    )
    .json();
  const transaction = results.at(-1) as AuthTransactionView<'authorization'> | null | undefined;
  return transaction
    ? { success: true, data: transaction }
    : authenticationError('error.auth.transaction.state_conflict');
}

/** Reads an active transaction only when the browser verifier still matches. */
export async function getAuthTransaction(
  db: Surreal,
  input: unknown,
): Promise<DataManagerResult<AuthTransactionView>> {
  const parsed = v.safeParse(GetAuthTransactionInputSchema, input);
  if (!parsed.success) return invalidInput(parsed.issues);

  const transaction = await querySingle<AuthTransactionView>(
    db,
    `
      SELECT id, kind, status, account, organization, parent, return_to, metadata,
        attempts, max_attempts, expires_at, consumed_at, version
      FROM $transaction
      WHERE browser_verifier_hash = $browserVerifierHash
        AND expires_at > time::now()
        AND consumed_at IS NONE
      LIMIT 1;
    `,
    {
      transaction: transactionRecordId(parsed.output.id),
      browserVerifierHash: parsed.output.browserVerifierHash,
    },
  );

  return transaction ? { success: true, data: transaction } : transactionErrorForStatus('invalid');
}

/** Verifies a password and advances a pending transaction to MFA or authorization atomically. */
export async function confirmPasswordAuthTransaction(
  db: Surreal,
  input: unknown,
): Promise<DataManagerResult<AuthTransactionView>> {
  const parsed = v.safeParse(ConfirmPasswordAuthTransactionInputSchema, input);
  if (!parsed.success) return invalidInput(parsed.issues);

  const output = parsed.output;
  const transactionRecord = transactionRecordId(output.id);
  const account = recordId('account', output.accountId);
  const results = await db
    .query<unknown[]>(
      `
        BEGIN TRANSACTION;
        LET $activeAccount = (
          SELECT id, credential_version FROM account WHERE id = $account AND status = 'active' LIMIT 1
        )[0];
        LET $passwordAuthenticator = IF $activeAccount IS NONE THEN NONE ELSE (
          SELECT id FROM account_authenticator
          WHERE account = $account
            AND kind = 'password'
            AND purpose = 'primary'
            AND status = 'active'
            AND crypto::argon2::compare(secret_hash, $password) = true
          LIMIT 1
        )[0] END;
        LET $mfaAuthenticator = IF $passwordAuthenticator IS NONE THEN NONE ELSE (
          SELECT kind FROM account_authenticator
          WHERE account = $account AND purpose = 'mfa' AND status = 'active'
          LIMIT 1
        )[0] END;
        LET $transaction = IF $passwordAuthenticator IS NONE THEN NONE ELSE (
          UPDATE $transaction
          SET metadata.authorization.primary_method = 'password',
            metadata.authorization.primary_credential_version = $activeAccount.credential_version,
            metadata.authorization.pending_mfa_method = $mfaAuthenticator.kind,
            status = IF $mfaAuthenticator IS NONE THEN 'authorized' ELSE 'awaiting_mfa' END,
            version = version + 1
          WHERE browser_verifier_hash = $browserVerifierHash
            AND account = $account
            AND status IN ['pending', 'awaiting_primary']
            AND version = $expectedVersion
            AND attempts < max_attempts
            AND expires_at > time::now()
            AND consumed_at IS NONE
          RETURN AFTER
        )[0] END;
        COMMIT TRANSACTION;
        RETURN $transaction;
      `,
      {
        transaction: transactionRecord,
        account,
        browserVerifierHash: output.browserVerifierHash,
        expectedVersion: output.expectedVersion,
        password: output.password,
      },
    )
    .json();
  const transaction = results.at(-1) as AuthTransactionView | null | undefined;
  if (transaction) return { success: true, data: transaction };

  await db.query(
    `
      UPDATE $transaction
      SET attempts = attempts + 1,
        status = IF attempts + 1 >= max_attempts THEN 'failed' ELSE status END
      WHERE browser_verifier_hash = $browserVerifierHash
        AND account = $account
        AND status IN ['pending', 'awaiting_primary']
        AND version = $expectedVersion
        AND attempts < max_attempts
        AND expires_at > time::now()
        AND consumed_at IS NONE;
    `,
    {
      transaction: transactionRecord,
      account,
      browserVerifierHash: output.browserVerifierHash,
      expectedVersion: output.expectedVersion,
    },
  );
  return authenticationError('error.auth.pass.incorrect');
}

export interface AccountPasskeyItem {
  id: string;
  credentialId: string;
  publicKey: string;
  counter: number;
  transports?: string[];
}

/** Reads active passkeys for an account. */
export async function getAccountPasskeys(
  db: Surreal,
  accountId: string,
): Promise<AccountPasskeyItem[]> {
  const account = recordId('account', accountId);
  const rows = await db
    .query<
      [
        Array<{
          id: RecordId<'account_authenticator'>;
          identifier?: string;
          public_key?: string;
          metadata?: { counter?: number; transports?: string[] };
        }>,
      ]
    >(
      `
        SELECT id, identifier, public_key, metadata
        FROM account_authenticator
        WHERE account = $account
          AND kind = 'passkey'
          AND purpose = 'primary'
          AND status = 'active';
      `,
      { account },
    )
    .json();

  return (rows[0] ?? [])
    .filter((r) => r.identifier && r.public_key)
    .map((r) => ({
      id: r.id.toString(),
      credentialId: r.identifier!,
      publicKey: r.public_key!,
      counter: r.metadata?.counter ?? 0,
      transports: r.metadata?.transports,
    }));
}

/** Stores an encrypted WebAuthn challenge before presenting passkey authentication options. */
export async function setPasskeyAuthTransactionChallenge(
  db: Surreal,
  input: unknown,
): Promise<DataManagerResult<AuthTransactionView<'authorization'>>> {
  const parsed = v.safeParse(SetPasskeyAuthTransactionChallengeInputSchema, input);
  if (!parsed.success) return invalidInput(parsed.issues);

  const transaction = await querySingle<AuthTransactionView<'authorization'>>(
    db,
    `
      UPDATE $transaction
      SET metadata.authorization.passkey.challenge_ciphertext = $challengeCiphertext,
        status = 'awaiting_primary',
        version = version + 1
      WHERE kind = 'authorization'
        AND account = $account
        AND status IN ['pending', 'awaiting_primary']
        AND version = $expectedVersion
        AND browser_verifier_hash = $browserVerifierHash
        AND expires_at > time::now()
        AND consumed_at IS NONE
      RETURN AFTER;
    `,
    {
      transaction: transactionRecordId(parsed.output.id),
      account: recordId('account', parsed.output.accountId),
      browserVerifierHash: parsed.output.browserVerifierHash,
      expectedVersion: parsed.output.expectedVersion,
      challengeCiphertext: parsed.output.challengeCiphertext,
    },
  );
  return transaction
    ? { success: true, data: transaction }
    : authenticationError('error.auth.transaction.state_conflict');
}

/** Advances a transaction only after the server verifies a passkey assertion. */
export async function authorizePasskeyAuthTransaction(
  db: Surreal,
  input: unknown,
): Promise<DataManagerResult<AuthTransactionView<'authorization'>>> {
  const parsed = v.safeParse(AuthorizePasskeyAuthTransactionInputSchema, input);
  if (!parsed.success) return invalidInput(parsed.issues);

  const output = parsed.output;
  const results = await db
    .query<unknown[]>(
      `
        BEGIN TRANSACTION;
        LET $transaction = (
          SELECT id FROM $transactionRecord
          WHERE kind = 'authorization'
            AND account = $account
            AND status = 'awaiting_primary'
            AND version = $expectedVersion
            AND browser_verifier_hash = $browserVerifierHash
            AND expires_at > time::now()
            AND consumed_at IS NONE
          LIMIT 1
        )[0];
        LET $activeAccount = (SELECT id, credential_version FROM account
          WHERE id = $account AND status = 'active' LIMIT 1)[0];
        LET $passkey = IF $transaction IS NONE OR $activeAccount IS NONE THEN NONE ELSE (
          UPDATE $authenticator
          SET metadata.counter = $newCounter,
            metadata.last_used_at = time::now()
          WHERE account = $account
            AND kind = 'passkey'
            AND purpose = 'primary'
            AND status = 'active'
            AND metadata.counter <= $newCounter
          RETURN AFTER
        )[0] END;
        LET $mfaAuthenticator = IF $passkey IS NONE THEN NONE ELSE (
          SELECT kind FROM account_authenticator
          WHERE account = $account AND purpose = 'mfa' AND status = 'active'
          LIMIT 1
        )[0] END;
        LET $transactionUpdate = IF $passkey IS NONE THEN NONE ELSE (
          UPDATE $transaction.id
          SET metadata.authorization.primary_method = 'passkey',
            metadata.authorization.primary_credential_version = $activeAccount.credential_version,
            metadata.authorization.pending_mfa_method = $mfaAuthenticator.kind,
            metadata.authorization.passkey.challenge_ciphertext = NONE,
            status = IF $mfaAuthenticator IS NONE THEN 'authorized' ELSE 'awaiting_mfa' END,
            version = version + 1
          RETURN AFTER
        )[0] END;
        COMMIT TRANSACTION;
        RETURN $transactionUpdate;
      `,
      {
        transactionRecord: transactionRecordId(output.id),
        account: recordId('account', output.accountId),
        authenticator: recordId('account_authenticator', output.authenticatorId),
        browserVerifierHash: output.browserVerifierHash,
        expectedVersion: output.expectedVersion,
        newCounter: output.newCounter,
      },
    )
    .json();
  const transaction = results.at(-1) as AuthTransactionView<'authorization'> | null | undefined;
  return transaction
    ? { success: true, data: transaction }
    : authenticationError('error.auth.transaction.state_conflict');
}

/** Advances an MFA transaction after the server verifies a TOTP against its decrypted secret. */
export async function confirmTotpAuthTransaction(
  db: Surreal,
  input: unknown,
): Promise<DataManagerResult<AuthTransactionView<'authorization'>>> {
  const parsed = v.safeParse(ConfirmTotpAuthTransactionInputSchema, input);
  if (!parsed.success) return invalidInput(parsed.issues);

  const transaction = await querySingle<AuthTransactionView<'authorization'>>(
    db,
    `
      UPDATE $transaction
      SET status = 'authorized', version = version + 1
      WHERE kind = 'authorization'
        AND account = $account
        AND status = 'awaiting_mfa'
        AND version = $expectedVersion
        AND browser_verifier_hash = $browserVerifierHash
        AND expires_at > time::now()
        AND consumed_at IS NONE
        AND $authenticator IN (
          SELECT VALUE id FROM account_authenticator
          WHERE account = $account AND kind = 'totp' AND purpose = 'mfa' AND status = 'active'
        )
      RETURN AFTER;
    `,
    {
      transaction: transactionRecordId(parsed.output.id),
      account: recordId('account', parsed.output.accountId),
      authenticator: recordId('account_authenticator', parsed.output.authenticatorId),
      browserVerifierHash: parsed.output.browserVerifierHash,
      expectedVersion: parsed.output.expectedVersion,
    },
  );
  return transaction
    ? { success: true, data: transaction }
    : authenticationError('error.auth.transaction.state_conflict');
}

/** Consumes a recovery code and advances the awaiting_mfa transaction to authorized. */
export async function confirmRecoveryCodeAuthTransaction(
  db: Surreal,
  input: unknown,
): Promise<DataManagerResult<AuthTransactionView<'authorization'>>> {
  const parsed = v.safeParse(ConfirmRecoveryCodeAuthTransactionInputSchema, input);
  if (!parsed.success) return invalidInput(parsed.issues);

  const results = await db
    .query<unknown[]>(
      `
        BEGIN TRANSACTION;
        LET $recoveryCode = (
          UPDATE account_authenticator
          SET status = 'disabled', disabled_at = time::now()
          WHERE account = $account
            AND kind = 'recovery_code'
            AND purpose = 'recovery'
            AND status = 'active'
            AND secret_hash = $codeHash
          RETURN AFTER
        )[0];
        LET $transactionUpdate = IF $recoveryCode IS NONE THEN NONE ELSE (
          UPDATE $transaction
          SET status = 'authorized',
            metadata.authorization.pending_mfa_method = NONE,
            metadata.authorization.primary_method = IF metadata.authorization.primary_method IS NONE THEN 'recovery' ELSE metadata.authorization.primary_method END,
            version = version + 1
          WHERE browser_verifier_hash = $browserVerifierHash
            AND account = $account
            AND status = 'awaiting_mfa'
            AND version = $expectedVersion
            AND expires_at > time::now()
            AND consumed_at IS NONE
          RETURN AFTER
        )[0] END;
        COMMIT TRANSACTION;
        RETURN $transactionUpdate;
      `,
      {
        transaction: transactionRecordId(parsed.output.id),
        account: recordId('account', parsed.output.accountId),
        browserVerifierHash: parsed.output.browserVerifierHash,
        expectedVersion: parsed.output.expectedVersion,
        codeHash: parsed.output.codeHash,
      },
    )
    .json();

  const transaction = results.at(-1) as AuthTransactionView<'authorization'> | null | undefined;
  return transaction
    ? { success: true, data: transaction }
    : authenticationError('error.auth.otp.invalid');
}

export interface ActiveMfaAuthenticatorInfo {
  id: string;
  kind: 'totp' | 'email_otp' | 'sms_otp';
  secretCiphertext?: string;
  metadata?: Record<string, unknown>;
}

/** Finds an active MFA authenticator for an account. */
export async function getActiveMfaAuthenticator(
  db: Surreal,
  input: {
    accountId: string;
    kind?: 'totp' | 'email_otp' | 'sms_otp';
  },
): Promise<DataManagerResult<ActiveMfaAuthenticatorInfo | null>> {
  const account = recordId('account', input.accountId);
  const rows = await db
    .query<
      [
        Array<{
          id: RecordId<'account_authenticator'>;
          kind: string;
          secret_ciphertext?: string;
          metadata?: Record<string, unknown>;
        }>,
      ]
    >(
      input.kind
        ? `SELECT id, kind, secret_ciphertext, metadata FROM account_authenticator WHERE account = $account AND purpose = 'mfa' AND status = 'active' AND kind = $kind LIMIT 1;`
        : `SELECT id, kind, secret_ciphertext, metadata FROM account_authenticator WHERE account = $account AND purpose = 'mfa' AND status = 'active' LIMIT 1;`,
      {
        account,
        ...(input.kind ? { kind: input.kind } : {}),
      },
    )
    .json();

  const candidate = rows[0]?.[0];
  if (!candidate) return { success: true, data: null };

  return {
    success: true,
    data: {
      id: candidate.id.toString(),
      kind: candidate.kind as 'totp' | 'email_otp' | 'sms_otp',
      secretCiphertext: candidate.secret_ciphertext,
      metadata: candidate.metadata,
    },
  };
}

/** Consumes a transaction-bound MFA OTP and advances the transaction to authorized. */
export async function confirmOtpAuthTransaction(
  db: Surreal,
  input: unknown,
): Promise<DataManagerResult<AuthTransactionView>> {
  const parsed = v.safeParse(ConfirmOtpAuthTransactionInputSchema, input);
  if (!parsed.success) return invalidInput(parsed.issues);

  const output = parsed.output;
  const transactionRecord = transactionRecordId(output.id);
  const account = recordId('account', output.accountId);
  const authenticator = recordId('account_authenticator', output.authenticatorId);
  const results = await db
    .query<unknown[]>(
      `
        BEGIN TRANSACTION;
        LET $validTransaction = (
          SELECT id FROM $transaction
          WHERE browser_verifier_hash = $browserVerifierHash
            AND account = $account
            AND status = 'awaiting_mfa'
            AND version = $expectedVersion
            AND expires_at > time::now()
            AND consumed_at IS NONE
          LIMIT 1
        )[0];
        LET $challenge = IF $validTransaction IS NONE THEN NONE ELSE (
          UPDATE $challenge
          SET consumed_at = time::now()
          WHERE transaction = $transaction
            AND account = $account
            AND authenticator = $authenticator
            AND purpose = 'mfa'
            AND code_hash = $codeHash
            AND expires_at > time::now()
            AND consumed_at IS NONE
            AND attempts < max_attempts
          RETURN AFTER
        )[0] END;
        LET $transactionUpdate = IF $challenge IS NONE THEN NONE ELSE (
          UPDATE $transaction
          SET status = 'authorized', version = version + 1
          WHERE browser_verifier_hash = $browserVerifierHash
            AND account = $account
            AND status = 'awaiting_mfa'
            AND version = $expectedVersion
            AND expires_at > time::now()
            AND consumed_at IS NONE
          RETURN AFTER
        )[0] END;
        COMMIT TRANSACTION;
        RETURN $transactionUpdate;
      `,
      {
        transaction: transactionRecord,
        challenge: recordId('auth_otp_challenge', output.otpChallengeId),
        account,
        authenticator,
        browserVerifierHash: output.browserVerifierHash,
        expectedVersion: output.expectedVersion,
        codeHash: output.codeHash,
      },
    )
    .json();
  const transaction = results.at(-1) as AuthTransactionView | null | undefined;
  if (transaction) return { success: true, data: transaction };

  await db.query(
    `
      UPDATE $challenge
      SET attempts = attempts + 1
      WHERE transaction = $transaction
        AND account = $account
        AND authenticator = $authenticator
        AND code_hash != $codeHash
        AND expires_at > time::now()
        AND consumed_at IS NONE
        AND attempts < max_attempts;
    `,
    {
      transaction: transactionRecord,
      challenge: recordId('auth_otp_challenge', output.otpChallengeId),
      account,
      authenticator,
      codeHash: output.codeHash,
    },
  );
  return authenticationError('error.auth.otp.invalid');
}

/** Consumes an authorized transaction; the app issues its stateless access cookie afterward. */
export async function completeAuthTransaction(
  db: Surreal,
  input: unknown,
): Promise<DataManagerResult<CompletedAuthTransaction>> {
  const parsed = v.safeParse(CompleteAuthTransactionInputSchema, input);
  if (!parsed.success) return invalidInput(parsed.issues);

  const transaction = await querySingle<CompletedAuthTransaction>(
    db,
    `
      UPDATE $transaction
      SET status = 'completed', consumed_at = time::now(), version = version + 1
      WHERE browser_verifier_hash = $browserVerifierHash
        AND status = 'authorized'
        AND version = $expectedVersion
        AND account = $account
        AND expires_at > time::now()
        AND consumed_at IS NONE
      RETURN AFTER;
    `,
    {
      transaction: transactionRecordId(parsed.output.id),
      browserVerifierHash: parsed.output.browserVerifierHash,
      expectedVersion: parsed.output.expectedVersion,
      account: recordId('account', parsed.output.accountId),
    },
  );
  return transaction
    ? { success: true, data: transaction }
    : authenticationError('error.auth.transaction.state_conflict');
}

/** Creates a single-use, seven-day organization grant in the shared transaction table. */
export async function createOrganizationInvitationTransaction(
  db: Surreal,
  input: unknown,
): Promise<DataManagerResult<RedeemableOrganizationInvitation>> {
  const parsed = v.safeParse(CreateOrganizationInvitationTransactionInputSchema, input);
  if (!parsed.success) return invalidInput(parsed.issues);
  if (!hasAllowedExpiry(parsed.output.expiresAt, ORGANIZATION_INVITATION_MAX_DURATION_MS)) {
    return authenticationError('error.auth.invitation.invalid');
  }

  const output = parsed.output;
  const organization = recordId('organization', output.organizationId);
  const issuer = recordId('account', output.issuedByAccountId);
  const ssoConnection = optionalRecordId('organization_sso_connection', output.ssoConnectionId);
  const canIssue = await querySingle<{ id: RecordId<'belongs_to'> }>(
    db,
    `
      SELECT id FROM belongs_to
      WHERE in = $issuer AND out = $organization AND status = 'active'
        AND role IN ['owner', 'admin']
      LIMIT 1;
    `,
    { issuer, organization },
  );
  if (!canIssue) return authenticationError('error.auth.invitation.invalid');

  if (ssoConnection) {
    const matchesOrganization = await querySingle<{ id: RecordId<'organization_sso_connection'> }>(
      db,
      "SELECT id FROM $connection WHERE organization = $organization AND status = 'active' LIMIT 1;",
      { connection: ssoConnection, organization },
    );
    if (!matchesOrganization) return authenticationError('error.auth.invitation.invalid');
  }

  const transaction = await querySingle<Pick<AuthTransaction, 'id'>>(
    db,
    "CREATE type::record('auth_transaction', $transactionId) CONTENT $content RETURN AFTER;",
    {
      transactionId: output.id,
      content: {
        kind: 'organization_invitation',
        status: 'pending',
        organization,
        expires_at: asDate(output.expiresAt),
        metadata: {
          invitation: {
            issued_by: issuer,
            token_hash: output.tokenHash,
            role: output.role,
            ...(output.targetEmail ? { target_email: output.targetEmail } : {}),
            ...(ssoConnection ? { sso_connection: ssoConnection } : {}),
          },
        },
      },
    },
  );
  if (!transaction)
    throw new Error('SurrealDB did not create the organization invitation transaction.');
  return {
    success: true,
    data: {
      id: transaction.id,
      organization,
      ...(ssoConnection ? { ssoConnection } : {}),
      role: output.role,
      ...(output.targetEmail ? { targetEmail: output.targetEmail } : {}),
      expiresAt: asDate(output.expiresAt),
      status: 'pending',
    },
  };
}

/** Returns the public scope of a still-redeemable organization invitation. */
export async function getRedeemableOrganizationInvitation(
  db: Surreal,
  input: unknown,
): Promise<DataManagerResult<RedeemableOrganizationInvitation>> {
  const parsed = v.safeParse(GetRedeemableOrganizationInvitationInputSchema, input);
  if (!parsed.success) return invalidInput(parsed.issues);

  const invitation = await querySingle<RedeemableOrganizationInvitation>(
    db,
    `
      SELECT id, organization,
        metadata.invitation.sso_connection AS ssoConnection,
        metadata.invitation.role AS role,
        metadata.invitation.target_email AS targetEmail,
        expires_at AS expiresAt,
        status
      FROM $transaction
      WHERE kind = 'organization_invitation'
        AND metadata.invitation.token_hash = $tokenHash
        AND status = 'pending'
        AND expires_at > time::now()
        AND consumed_at IS NONE
      LIMIT 1;
    `,
    { transaction: transactionRecordId(parsed.output.id), tokenHash: parsed.output.tokenHash },
  );
  return invitation
    ? { success: true, data: invitation }
    : authenticationError('error.auth.invitation.invalid');
}

/** Redeems a grant into a short-lived browser-bound child transaction without consuming the grant. */
export async function redeemOrganizationInvitation(
  db: Surreal,
  input: unknown,
): Promise<DataManagerResult<AuthTransactionView>> {
  const parsed = v.safeParse(RedeemOrganizationInvitationInputSchema, input);
  if (!parsed.success) return invalidInput(parsed.issues);
  if (!hasAllowedExpiry(parsed.output.expiresAt, AUTH_TRANSACTION_MAX_DURATION_MS)) {
    return authenticationError('error.auth.transaction.invalid');
  }

  const output = parsed.output;
  const returnToField = output.returnTo ? 'return_to: $returnTo,' : '';
  const results = await db
    .query<unknown[]>(
      `
        BEGIN TRANSACTION;
        LET $grant = (
          SELECT id, organization, metadata.invitation AS invitation
          FROM $invitation
          WHERE kind = 'organization_invitation'
            AND metadata.invitation.token_hash = $tokenHash
            AND status = 'pending'
            AND expires_at > time::now()
            AND consumed_at IS NONE
          LIMIT 1
        )[0];
        LET $journey = IF $grant IS NONE THEN NONE ELSE (
          CREATE $child CONTENT {
            kind: IF $grant.invitation.sso_connection IS NONE THEN 'registration' ELSE 'authorization' END,
            status: IF $grant.invitation.sso_connection IS NONE THEN 'awaiting_primary' ELSE 'awaiting_sso' END,
            parent: $grant.id,
            organization: $grant.organization,
            browser_verifier_hash: $browserVerifierHash,
            metadata: IF $grant.invitation.sso_connection IS NONE THEN {} ELSE {
              authorization: { sso: { connection: $grant.invitation.sso_connection } }
            } END,
            ${returnToField}
            expires_at: $expiresAt
          }
        )[0] END;
        COMMIT TRANSACTION;
        RETURN $journey;
      `,
      {
        invitation: transactionRecordId(output.id),
        child: transactionRecordId(output.childId),
        tokenHash: output.tokenHash,
        browserVerifierHash: output.browserVerifierHash,
        ...(output.returnTo ? { returnTo: output.returnTo } : {}),
        expiresAt: asDate(output.expiresAt),
      },
    )
    .json();
  const transaction = results.at(-1) as AuthTransactionView | null | undefined;
  return transaction
    ? { success: true, data: transaction }
    : authenticationError('error.auth.invitation.invalid');
}

/** Binds a completed local registration to its invitation journey. */
export async function authorizeRegistrationAuthTransaction(
  db: Surreal,
  input: unknown,
): Promise<DataManagerResult<AuthTransactionView>> {
  const parsed = v.safeParse(AuthorizeRegistrationAuthTransactionInputSchema, input);
  if (!parsed.success) return invalidInput(parsed.issues);

  const transaction = await querySingle<AuthTransactionView>(
    db,
    `
      UPDATE $transaction
      SET account = $account,
        metadata.registration.primary_method = 'registration',
        status = 'authorized',
        version = version + 1
      WHERE kind = 'registration'
        AND browser_verifier_hash = $browserVerifierHash
        AND status = 'awaiting_primary'
        AND version = $expectedVersion
        AND expires_at > time::now()
        AND consumed_at IS NONE
        AND $account IN (SELECT VALUE id FROM account WHERE id = $account AND status = 'active')
      RETURN AFTER;
    `,
    {
      transaction: transactionRecordId(parsed.output.id),
      browserVerifierHash: parsed.output.browserVerifierHash,
      expectedVersion: parsed.output.expectedVersion,
      account: recordId('account', parsed.output.accountId),
    },
  );
  return transaction
    ? { success: true, data: transaction }
    : authenticationError('error.auth.transaction.state_conflict');
}

/** Binds a verified corporate identity to an invitation journey and authorizes it. */
export async function authorizeOrganizationInvitationSso(
  db: Surreal,
  input: unknown,
): Promise<DataManagerResult<AuthTransactionView>> {
  const parsed = v.safeParse(AuthorizeOrganizationInvitationSsoInputSchema, input);
  if (!parsed.success) return invalidInput(parsed.issues);

  const output = parsed.output;
  const account = recordId('account', output.accountId);
  const transaction = await querySingle<AuthTransactionView>(
    db,
    `
      UPDATE $transaction
      SET account = $account,
        metadata.authorization.primary_method = 'sso',
        metadata.authorization.sso.subject = $federatedSubject,
        metadata.authorization.sso.claims = $federatedMetadata,
        status = 'authorized',
        version = version + 1
      WHERE kind = 'authorization'
        AND browser_verifier_hash = $browserVerifierHash
        AND status = 'awaiting_sso'
        AND version = $expectedVersion
        AND expires_at > time::now()
        AND consumed_at IS NONE
        AND metadata.authorization.sso.connection IS NOT NONE
        AND metadata.authorization.sso.connection NOT IN (
          SELECT VALUE sso_connection FROM belongs_to
          WHERE federated_subject = $federatedSubject AND in != $account
        )
      RETURN AFTER;
    `,
    {
      transaction: transactionRecordId(output.id),
      browserVerifierHash: output.browserVerifierHash,
      expectedVersion: output.expectedVersion,
      account,
      federatedSubject: output.federatedSubject,
      federatedMetadata: output.federatedMetadata,
    },
  );
  return transaction
    ? { success: true, data: transaction }
    : authenticationError('error.auth.invitation.sso_required');
}

/** Consumes an authorized invitation journey and grants organization access atomically. */
export async function completeOrganizationInvitation(
  db: Surreal,
  input: unknown,
): Promise<DataManagerResult<BelongsTo>> {
  const parsed = v.safeParse(CompleteOrganizationInvitationInputSchema, input);
  if (!parsed.success) return invalidInput(parsed.issues);

  const output = parsed.output;
  const account = recordId('account', output.accountId);
  const results = await db
    .query<unknown[]>(
      `
        BEGIN TRANSACTION;
        LET $journey = (
          SELECT id, parent, organization, metadata.authorization.sso AS sso
          FROM $journeyRecord
          WHERE browser_verifier_hash = $browserVerifierHash
            AND account = $account
            AND status = 'authorized'
            AND version = $expectedVersion
            AND expires_at > time::now()
            AND consumed_at IS NONE
          LIMIT 1
        )[0];
        LET $grant = IF $journey IS NONE OR $journey.parent IS NONE THEN NONE ELSE (
          SELECT id, organization, metadata.invitation AS invitation
          FROM $journey.parent
          WHERE kind = 'organization_invitation'
            AND status = 'pending'
            AND expires_at > time::now()
            AND consumed_at IS NONE
          LIMIT 1
        )[0] END;
        LET $canComplete = $grant IS NOT NONE
          AND $journey.organization = $grant.organization
          AND $journey.sso.connection = $grant.invitation.sso_connection
          AND ($grant.invitation.target_email IS NONE OR $grant.invitation.target_email IN (
            SELECT VALUE identifier FROM account_identity
            WHERE account = $account AND provider = 'email' AND status = 'active'
          ))
          AND ($grant.invitation.sso_connection IS NONE OR $journey.sso.subject IS NOT NONE);
        LET $organization = IF $grant IS NONE THEN NONE ELSE $grant.organization END;
        LET $membership = IF $canComplete = false THEN NONE ELSE (
          RELATE $account->$membershipRecord->$organization SET
            role = $grant.invitation.role,
            status = 'active',
            origin = 'invite',
            grant_transaction = $grant.id,
            sso_connection = $grant.invitation.sso_connection,
            federated_subject = $journey.sso.subject,
            federated_metadata = $journey.sso.claims,
            sso_verified_at = IF $grant.invitation.sso_connection IS NONE THEN NONE ELSE time::now() END,
            sso_last_verified_at = IF $grant.invitation.sso_connection IS NONE THEN NONE ELSE time::now() END,
            activated_at = time::now()
        )[0] END;
        LET $consumedGrant = IF $membership IS NONE THEN NONE ELSE (
          UPDATE $grant.id SET status = 'completed', consumed_at = time::now(), version = version + 1
          WHERE status = 'pending' AND consumed_at IS NONE
          RETURN AFTER
        )[0] END;
        LET $completedJourney = IF $consumedGrant IS NONE THEN NONE ELSE (
          UPDATE $journey.id SET status = 'completed', consumed_at = time::now(), version = version + 1
          WHERE status = 'authorized' AND consumed_at IS NONE
          RETURN AFTER
        )[0] END;
        COMMIT TRANSACTION;
        RETURN IF $completedJourney IS NONE THEN NONE ELSE $membership END;
      `,
      {
        journeyRecord: transactionRecordId(output.id),
        browserVerifierHash: output.browserVerifierHash,
        expectedVersion: output.expectedVersion,
        account,
        membershipRecord: recordId('belongs_to', output.membershipId),
      },
    )
    .json();
  const membership = results.at(-1) as BelongsTo | null | undefined;
  return membership
    ? { success: true, data: membership }
    : authenticationError('error.auth.invitation.invalid');
}

/** Revokes a still-pending invitation grant without affecting existing memberships. */
export async function revokeOrganizationInvitationTransaction(
  db: Surreal,
  input: unknown,
): Promise<DataManagerResult<AuthTransactionView>> {
  const parsed = v.safeParse(RevokeOrganizationInvitationTransactionInputSchema, input);
  if (!parsed.success) return invalidInput(parsed.issues);

  const issuer = recordId('account', parsed.output.issuedByAccountId);
  const transaction = await querySingle<AuthTransactionView>(
    db,
    `
      UPDATE $transaction SET status = 'revoked', version = version + 1
      WHERE kind = 'organization_invitation'
        AND status = 'pending'
        AND version = $expectedVersion
        AND metadata.invitation.issued_by = $issuer
        AND organization IN (
          SELECT VALUE out FROM belongs_to
          WHERE in = $issuer AND status = 'active' AND role IN ['owner', 'admin']
        )
      RETURN AFTER;
    `,
    {
      transaction: transactionRecordId(parsed.output.id),
      issuer,
      expectedVersion: parsed.output.expectedVersion,
    },
  );
  return transaction
    ? { success: true, data: transaction }
    : authenticationError('error.auth.invitation.invalid');
}

/** Revokes one account's access to one organization without changing its global account. */
export async function revokeOrganizationAccess(
  db: Surreal,
  input: unknown,
): Promise<DataManagerResult<BelongsTo>> {
  const parsed = v.safeParse(RevokeOrganizationAccessInputSchema, input);
  if (!parsed.success) return invalidInput(parsed.issues);

  const membership = await querySingle<BelongsTo>(
    db,
    `
      UPDATE belongs_to
      SET status = 'revoked', revoked_at = time::now(), revoked_reason = $reason
      WHERE in = $account AND out = $organization AND status != 'revoked'
      RETURN AFTER;
    `,
    {
      account: recordId('account', parsed.output.accountId),
      organization: recordId('organization', parsed.output.organizationId),
      reason: parsed.output.reason,
    },
  );
  return membership
    ? { success: true, data: membership }
    : authenticationError('error.auth.invitation.invalid');
}

/** Marks active organization memberships as blocked until each user completes corporate SSO. */
export async function enforceOrganizationSso(
  db: Surreal,
  input: unknown,
): Promise<DataManagerResult<number>> {
  const parsed = v.safeParse(EnforceOrganizationSsoInputSchema, input);
  if (!parsed.success) return invalidInput(parsed.issues);

  const organization = recordId('organization', parsed.output.organizationId);
  const connection = recordId('organization_sso_connection', parsed.output.connectionId);
  const administrator = recordId('account', parsed.output.enforcedByAccountId);
  const canEnforce = await querySingle<{ id: RecordId<'belongs_to'> }>(
    db,
    `
      SELECT id FROM belongs_to
      WHERE in = $administrator AND out = $organization AND status = 'active'
        AND role IN ['owner', 'admin']
      LIMIT 1;
    `,
    { administrator, organization },
  );
  const activeConnection = await querySingle<{ id: RecordId<'organization_sso_connection'> }>(
    db,
    "SELECT id FROM $connection WHERE organization = $organization AND status = 'active' LIMIT 1;",
    { connection, organization },
  );
  if (!canEnforce || !activeConnection) return authenticationError('error.auth.invitation.invalid');

  const [memberships] = await db
    .query<[BelongsTo[]]>(
      `
        UPDATE belongs_to
        SET status = 'pending_sso',
          sso_connection = $connection,
          federated_subject = NONE,
          federated_metadata = NONE,
          sso_required_at = time::now(),
          sso_verified_at = NONE,
          sso_last_verified_at = NONE
        WHERE out = $organization AND status = 'active'
        RETURN AFTER;
      `,
      { connection, organization },
    )
    .json();
  return { success: true, data: memberships.length };
}

/** Activates one pending organization membership after a verified SSO assertion. */
export async function verifyOrganizationMembershipSso(
  db: Surreal,
  input: unknown,
): Promise<DataManagerResult<BelongsTo>> {
  const parsed = v.safeParse(VerifyOrganizationMembershipSsoInputSchema, input);
  if (!parsed.success) return invalidInput(parsed.issues);

  const output = parsed.output;
  const account = recordId('account', output.accountId);
  const organization = recordId('organization', output.organizationId);
  const connection = recordId('organization_sso_connection', output.connectionId);
  const results = await db
    .query<unknown[]>(
      `
        BEGIN TRANSACTION;
        LET $connection = (
          SELECT id FROM $connectionRecord
          WHERE organization = $organization AND status = 'active'
          LIMIT 1
        )[0];
        LET $claimed = IF $connection IS NONE THEN NONE ELSE (
          SELECT id FROM belongs_to
          WHERE sso_connection = $connection.id
            AND federated_subject = $federatedSubject
            AND in != $account
          LIMIT 1
        )[0] END;
        LET $membership = IF $claimed IS NOT NONE THEN NONE ELSE (
          UPDATE belongs_to
          SET status = 'active',
            federated_subject = $federatedSubject,
            federated_metadata = $federatedMetadata,
            sso_verified_at = time::now(),
            sso_last_verified_at = time::now(),
            activated_at = time::now()
          WHERE in = $account
            AND out = $organization
            AND sso_connection = $connection.id
            AND status = 'pending_sso'
          RETURN AFTER
        )[0] END;
        COMMIT TRANSACTION;
        RETURN $membership;
      `,
      {
        account,
        organization,
        connectionRecord: connection,
        federatedSubject: output.federatedSubject,
        federatedMetadata: output.federatedMetadata,
      },
    )
    .json();
  const membership = results.at(-1) as BelongsTo | null | undefined;
  return membership
    ? { success: true, data: membership }
    : authenticationError('error.auth.sso_identity.already_linked');
}

/** Revokes only the membership associated with a deprovisioning webhook identity. */
export async function revokeMembershipFromWebhook(
  db: Surreal,
  input: unknown,
): Promise<DataManagerResult<BelongsTo>> {
  const parsed = v.safeParse(RevokeMembershipFromWebhookInputSchema, input);
  if (!parsed.success) return invalidInput(parsed.issues);

  const output = parsed.output;
  const connection = recordId('organization_sso_connection', output.connectionId);
  const activeConnection = await querySingle<{ id: RecordId<'organization_sso_connection'> }>(
    db,
    `
      SELECT id FROM $connection
      WHERE issuer = $issuer AND status = 'active'
      LIMIT 1;
    `,
    { connection, issuer: output.issuer, subject: output.subject },
  );
  if (!activeConnection) return authenticationError('error.auth.invitation.invalid');

  const membership = await querySingle<BelongsTo>(
    db,
    `
      UPDATE belongs_to
      SET status = 'revoked', revoked_at = time::now(), revoked_reason = $reason
      WHERE sso_connection = $connection
        AND federated_subject = $subject
        AND status != 'revoked'
      RETURN AFTER;
    `,
    { connection, subject: output.subject, reason: output.reason },
  );
  return membership
    ? { success: true, data: membership }
    : authenticationError('error.auth.invitation.invalid');
}

export async function createOtpChallenge(
  db: Surreal,
  input: unknown,
): Promise<DataManagerResult<AuthOtpChallenge>> {
  const parsed = v.safeParse(CreateOtpChallengeInputSchema, input);
  if (!parsed.success) return invalidInput(parsed.issues);
  if (!hasAllowedExpiry(parsed.output.expiresAt, AUTH_OTP_MAX_DURATION_MS)) {
    return authenticationError('error.auth.otp.invalid');
  }

  const output = parsed.output;
  const account = optionalRecordId('account', output.accountId);
  const identity = optionalRecordId('account_identity', output.identityId);
  const authenticator = optionalRecordId('account_authenticator', output.authenticatorId);
  const transaction = optionalRecordId('auth_transaction', output.transactionId);

  if (account && identity) {
    const matchesIdentity = await querySingle<{ id: RecordId<'account_identity'> }>(
      db,
      'SELECT id FROM $identity WHERE account = $account LIMIT 1;',
      { account, identity },
    );
    if (!matchesIdentity) return authenticationError('error.auth.identity.invalid');
  }
  if (account && authenticator) {
    const matchesAuthenticator = await querySingle<{ id: RecordId<'account_authenticator'> }>(
      db,
      "SELECT id FROM $authenticator WHERE account = $account AND purpose = 'mfa' LIMIT 1;",
      { account, authenticator },
    );
    if (!matchesAuthenticator) return authenticationError('error.auth.otp.invalid');
  }
  if (transaction && account) {
    const matchesTransaction = await querySingle<{ id: RecordId<'auth_transaction'> }>(
      db,
      'SELECT id FROM $transaction WHERE account = $account LIMIT 1;',
      { account, transaction },
    );
    if (!matchesTransaction) return authenticationError('error.auth.transaction.invalid');
  }

  const content = {
    purpose: output.purpose,
    code_hash: output.codeHash,
    expires_at: asDate(output.expiresAt),
    max_attempts: output.maxAttempts,
    ...(account && {
      account,
    }),
    ...(identity && {
      identity,
    }),
    ...(authenticator && {
      authenticator,
    }),
    ...(transaction && {
      transaction,
    }),
  };
  const challenge = await querySingle<AuthOtpChallenge>(
    db,
    "CREATE type::record('auth_otp_challenge', $challengeId) CONTENT $content RETURN AFTER;",
    { challengeId: output.id, content },
  );
  if (!challenge) throw new Error('SurrealDB did not create the OTP challenge.');
  return { success: true, data: challenge };
}

/** Consumes a matching OTP hash once and records a bounded failed attempt otherwise. */
export async function consumeOtpChallenge(
  db: Surreal,
  input: unknown,
): Promise<DataManagerResult<AuthOtpChallenge>> {
  const parsed = v.safeParse(ConsumeOtpChallengeInputSchema, input);
  if (!parsed.success) return invalidInput(parsed.issues);

  const challenge = await querySingle<AuthOtpChallenge>(
    db,
    `
      UPDATE $challenge SET consumed_at = time::now()
      WHERE code_hash = $codeHash
        AND expires_at > time::now()
        AND consumed_at IS NONE
        AND attempts < max_attempts
      RETURN AFTER;
    `,
    {
      challenge: recordId('auth_otp_challenge', parsed.output.id),
      codeHash: parsed.output.codeHash,
    },
  );
  if (challenge) return { success: true, data: challenge };

  await db.query(
    `
      UPDATE $challenge SET attempts = attempts + 1
      WHERE code_hash != $codeHash
        AND expires_at > time::now()
        AND consumed_at IS NONE
        AND attempts < max_attempts;
    `,
    {
      challenge: recordId('auth_otp_challenge', parsed.output.id),
      codeHash: parsed.output.codeHash,
    },
  );

  return authenticationError('error.auth.otp.invalid');
}

/** Removes expired authentication transactions and OTP challenges in bounded batches. */
export async function purgeExpiredAuthTransactions(
  db: Surreal,
  input: unknown,
): Promise<DataManagerResult<PurgedAuthTransactions>> {
  const parsed = v.safeParse(PurgeExpiredAuthTransactionsInputSchema, input);
  if (!parsed.success) return invalidInput(parsed.issues);

  const [otpChallenges, transactions] = await db
    .query<[Array<{ id: string }>, Array<{ id: string }>]>(
      `
        DELETE (
          SELECT * FROM auth_otp_challenge WHERE expires_at <= time::now() LIMIT $limit
        ) RETURN BEFORE;

        DELETE (
          SELECT * FROM auth_transaction WHERE expires_at <= time::now() LIMIT $limit
        ) RETURN BEFORE;
      `,
      parsed.output,
    )
    .json();

  return {
    success: true,
    data: {
      otpChallenges: otpChallenges.length,
      transactions: transactions.length,
    },
  };
}

export interface StartedPasswordRecovery {
  transaction: AuthTransactionView<'upsert_password'>;
  targetEmail?: string;
}

/**
 * Starts a password recovery transaction for a given identifier (email or username).
 * Returns { success: true, data: null } if no matching active local account was found,
 * preventing account enumeration attacks.
 */
export async function startPasswordRecoveryTransaction(
  db: Surreal,
  input: unknown,
): Promise<DataManagerResult<StartedPasswordRecovery | null>> {
  const parsed = v.safeParse(StartPasswordRecoveryTransactionInputSchema, input);
  if (!parsed.success) return invalidInput(parsed.issues);

  if (!hasAllowedExpiry(parsed.output.expiresAt, AUTH_TRANSACTION_MAX_DURATION_MS)) {
    return authenticationError('error.auth.transaction.invalid');
  }

  const results = await db
    .query<
      [
        {
          transaction?: AuthTransactionView<'upsert_password'>;
          targetEmail?: string;
        }[],
      ]
    >(
      `
        BEGIN TRANSACTION;
        LET $identity = (
          SELECT account, identifier, provider
          FROM account_identity
          WHERE kind = 'local'
            AND issuer = 'galfus'
            AND (provider = 'email' OR provider = 'username')
            AND identifier = $identifier
            AND status = 'active'
          LIMIT 1
          FETCH account
        )[0];
        LET $account = IF $identity IS NONE THEN NONE ELSE $identity.account END;
        LET $transaction = IF $account IS NONE OR $account.status != 'active' THEN NONE ELSE (
          CREATE type::record('auth_transaction', $transactionId) CONTENT {
            kind: 'upsert_password',
            status: 'pending',
            account: $account.id,
            browser_verifier_hash: $browserVerifierHash,
            expires_at: $expiresAt,
            metadata: {
              upsert_password: {
                reason: 'recovery',
              },
            },
          }
        )[0] END;
        LET $targetEmail = IF $account IS NONE THEN NONE ELSE IF $identity.provider = 'email' THEN $identity.identifier ELSE (
          SELECT VALUE identifier FROM account_identity
          WHERE account = $account.id AND provider = 'email' AND status = 'active'
          LIMIT 1
        )[0] END;
        COMMIT TRANSACTION;
        RETURN { transaction: $transaction, targetEmail: $targetEmail };
      `,
      {
        transactionId: parsed.output.id,
        browserVerifierHash: parsed.output.browserVerifierHash,
        identifier: parsed.output.identifier,
        expiresAt: asDate(parsed.output.expiresAt),
      },
    )
    .json();

  const row = results.at(-1) as
    | {
        transaction?: AuthTransactionView<'upsert_password'>;
        targetEmail?: string;
      }
    | null
    | undefined;

  if (!row?.transaction) {
    return { success: true, data: null };
  }

  return {
    success: true,
    data: {
      transaction: row.transaction,
      targetEmail: row.targetEmail,
    },
  };
}

/**
 * Resets an account password through a verified upsert_password / password_recovery transaction
 * and completes the transaction in a single atomic database operation.
 */
export async function completeUpsertPasswordTransaction(
  db: Surreal,
  input: unknown,
): Promise<DataManagerResult<CompletedAuthTransaction>> {
  const parsed = v.safeParse(CompleteUpsertPasswordTransactionInputSchema, input);
  if (!parsed.success) return invalidInput(parsed.issues);

  const account = recordId('account', parsed.output.accountId);
  const transaction = transactionRecordId(parsed.output.id);

  const results = await db
    .query<[unknown[]]>(
      `
        BEGIN TRANSACTION;
        LET $tx = (
          SELECT id, version FROM $transaction
          WHERE id = $transaction
            AND kind IN ['upsert_password', 'password_recovery']
            AND status IN ['pending', 'awaiting_primary', 'authorized']
            AND browser_verifier_hash = $browserVerifierHash
            AND version = $expectedVersion
            AND account = $account
            AND expires_at > time::now()
            AND consumed_at IS NONE
          LIMIT 1
        )[0];
        LET $updatedAccount = IF $tx IS NONE THEN NONE ELSE (
          UPDATE $account SET credential_version = credential_version + 1 RETURN AFTER
        )[0] END;
        LET $existingAuth = IF $updatedAccount IS NONE THEN NONE ELSE (
          SELECT id FROM account_authenticator
          WHERE account = $account AND kind = 'password' AND purpose = 'primary'
          LIMIT 1
        )[0] END;
        LET $savedAuth = IF $updatedAccount IS NONE THEN NONE ELSE IF $existingAuth IS NONE THEN (
          CREATE account_authenticator SET
            account = $account,
            kind = 'password',
            purpose = 'primary',
            status = 'active',
            secret_hash = crypto::argon2::generate($password),
            verified_at = time::now()
        )[0] ELSE (
          UPDATE $existingAuth.id
          SET status = 'active',
            disabled_at = NONE,
            secret_hash = crypto::argon2::generate($password),
            verified_at = time::now()
          RETURN AFTER
        )[0] END;
        LET $completedTx = IF $savedAuth IS NONE THEN NONE ELSE (
          UPDATE $tx.id
          SET status = 'completed',
            consumed_at = time::now(),
            version = version + 1
          RETURN id, account, status, return_to, consumed_at, version
        )[0] END;
        COMMIT TRANSACTION;
        RETURN $completedTx;
      `,
      {
        transaction,
        account,
        browserVerifierHash: parsed.output.browserVerifierHash,
        expectedVersion: parsed.output.expectedVersion,
        password: parsed.output.password,
      },
    )
    .json();

  const completed = results.at(-1) as CompletedAuthTransaction | null | undefined;

  return completed
    ? { success: true, data: completed }
    : authenticationError('error.auth.transaction.state_conflict');
}
