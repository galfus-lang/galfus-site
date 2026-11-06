import type { Surreal } from 'surrealdb';
import { RecordId, TextCodec } from 'surrealdb';
import * as v from 'valibot';

import type { AccountAuthenticator } from '../generated';
import { authenticationError, invalidInput, type DataManagerResult } from '../errors';
import {
  ActivateMfaAuthenticatorInputSchema,
  ConsumeRecoveryCodeAuthenticatorInputSchema,
  CreateMfaAuthenticatorInputSchema,
  PersistVerifiedPasskeyAuthenticatorInputSchema,
  ReplaceRecoveryCodeAuthenticatorsInputSchema,
  TouchPasskeyAuthenticatorInputSchema,
} from '../inputs/auth-foundation';

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

async function querySingle<T>(
  db: Surreal,
  query: string,
  bindings: Record<string, unknown>,
): Promise<T | null> {
  const [rows] = await db.query<[T[]]>(query, bindings).json();
  return (rows[0] as T | undefined) ?? null;
}

async function hasActiveAccount(db: Surreal, account: RecordId<'account'>): Promise<boolean> {
  return Boolean(
    await querySingle<{ id: RecordId<'account'> }>(
      db,
      "SELECT id FROM $account WHERE status = 'active' LIMIT 1;",
      { account },
    ),
  );
}

/** Creates a pending account authenticator for a global MFA method. */
export async function createMfaAuthenticator(
  db: Surreal,
  input: unknown,
): Promise<DataManagerResult<AccountAuthenticator>> {
  const parsed = v.safeParse(CreateMfaAuthenticatorInputSchema, input);
  if (!parsed.success) return invalidInput(parsed.issues);

  const output = parsed.output;
  const account = recordId('account', output.accountId);
  if (!(await hasActiveAccount(db, account))) {
    return authenticationError('error.auth.account.invalid');
  }

  if (output.identityId) {
    const identity = await querySingle<{ id: RecordId<'account_identity'> }>(
      db,
      "SELECT id FROM $identity WHERE account = $account AND status = 'active' LIMIT 1;",
      { identity: recordId('account_identity', output.identityId), account },
    );
    if (!identity) return authenticationError('error.auth.identity.invalid');
  }

  const authenticator = await querySingle<AccountAuthenticator>(
    db,
    "CREATE type::record('account_authenticator', $authenticatorId) CONTENT $content RETURN AFTER;",
    {
      authenticatorId: output.id,
      content: {
        account,
        kind: output.kind,
        purpose: 'mfa',
        ...(output.identityId ? { identity: recordId('account_identity', output.identityId) } : {}),
        ...(output.secretCiphertext ? { secret_ciphertext: output.secretCiphertext } : {}),
        metadata: output.label ? { label: output.label } : {},
      },
    },
  );
  if (!authenticator) throw new Error('SurrealDB did not create the MFA authenticator.');
  return { success: true, data: authenticator };
}

/** Activates an MFA authenticator only by consuming its bound, valid OTP challenge. */
export async function activateMfaAuthenticator(
  db: Surreal,
  input: unknown,
): Promise<DataManagerResult<AccountAuthenticator>> {
  const parsed = v.safeParse(ActivateMfaAuthenticatorInputSchema, input);
  if (!parsed.success) return invalidInput(parsed.issues);

  const output = parsed.output;
  const results = await db
    .query<unknown[]>(
      `
        BEGIN TRANSACTION;
        LET $challenge = (
          UPDATE $challenge
          SET consumed_at = time::now()
          WHERE account = $account
            AND authenticator = $authenticator
            AND purpose = 'mfa'
            AND code_hash = $codeHash
            AND expires_at > time::now()
            AND consumed_at IS NONE
            AND attempts < max_attempts
          RETURN AFTER
        )[0];
        LET $activatedAuthenticator = IF $challenge IS NONE THEN NONE ELSE (
          UPDATE $authenticator
          SET status = 'active', verified_at = time::now()
          WHERE account = $account AND purpose = 'mfa' AND status = 'pending'
          RETURN AFTER
        )[0] END;
        COMMIT TRANSACTION;
        RETURN $activatedAuthenticator;
      `,
      {
        challenge: recordId('auth_otp_challenge', output.otpChallengeId),
        authenticator: recordId('account_authenticator', output.id),
        account: recordId('account', output.accountId),
        codeHash: output.codeHash,
      },
    )
    .json();
  const authenticator = results.at(-1) as AccountAuthenticator | null | undefined;
  if (authenticator) return { success: true, data: authenticator };

  await db.query(
    `
      UPDATE $challenge SET attempts = attempts + 1
      WHERE account = $account
        AND authenticator = $authenticator
        AND purpose = 'mfa'
        AND code_hash != $codeHash
        AND expires_at > time::now()
        AND consumed_at IS NONE
        AND attempts < max_attempts;
    `,
    {
      challenge: recordId('auth_otp_challenge', output.otpChallengeId),
      authenticator: recordId('account_authenticator', output.id),
      account: recordId('account', output.accountId),
      codeHash: output.codeHash,
    },
  );

  return authenticationError('error.auth.otp.invalid');
}

/** Replaces every recovery code for an active account with a freshly generated hashed set. */
export async function replaceRecoveryCodeAuthenticators(
  db: Surreal,
  input: unknown,
): Promise<DataManagerResult<number>> {
  const parsed = v.safeParse(ReplaceRecoveryCodeAuthenticatorsInputSchema, input);
  if (!parsed.success) return invalidInput(parsed.issues);

  const account = recordId('account', parsed.output.accountId);
  if (!(await hasActiveAccount(db, account))) {
    return authenticationError('error.auth.account.invalid');
  }

  const results = await db
    .query<unknown[]>(
      `
        BEGIN TRANSACTION;
        DELETE account_authenticator
        WHERE account = $account AND kind = 'recovery_code' AND purpose = 'recovery';
        FOR $code IN $codes {
          CREATE type::record('account_authenticator', $code.id) CONTENT {
            account: $account,
            kind: 'recovery_code',
            purpose: 'recovery',
            status: 'active',
            secret_hash: $code.secretHash,
            verified_at: time::now()
          };
        };
        COMMIT TRANSACTION;
        RETURN $codes;
      `,
      { account, codes: parsed.output.codes },
    )
    .json();
  const codes = results.at(-1) as Array<{ id: string }> | undefined;
  return { success: true, data: codes?.length ?? 0 };
}

/** Consumes one hashed recovery code exactly once. */
export async function consumeRecoveryCodeAuthenticator(
  db: Surreal,
  input: unknown,
): Promise<DataManagerResult<AccountAuthenticator>> {
  const parsed = v.safeParse(ConsumeRecoveryCodeAuthenticatorInputSchema, input);
  if (!parsed.success) return invalidInput(parsed.issues);

  const authenticator = await querySingle<AccountAuthenticator>(
    db,
    `
      UPDATE account_authenticator
      SET status = 'disabled', disabled_at = time::now()
      WHERE account = $account
        AND kind = 'recovery_code'
        AND purpose = 'recovery'
        AND status = 'active'
        AND secret_hash = $codeHash
      RETURN AFTER;
    `,
    {
      account: recordId('account', parsed.output.accountId),
      codeHash: parsed.output.codeHash,
    },
  );
  return authenticator
    ? { success: true, data: authenticator }
    : authenticationError('error.auth.otp.invalid');
}

/** Persists a primary passkey only after the server has verified its WebAuthn registration response. */
export async function persistVerifiedPasskeyAuthenticator(
  db: Surreal,
  input: unknown,
): Promise<DataManagerResult<AccountAuthenticator>> {
  const parsed = v.safeParse(PersistVerifiedPasskeyAuthenticatorInputSchema, input);
  if (!parsed.success) return invalidInput(parsed.issues);

  const output = parsed.output;
  const account = recordId('account', output.accountId);
  const results = await db
    .query<unknown[]>(
      `BEGIN TRANSACTION;
     LET $current = (UPDATE $account SET credential_version = credential_version
       WHERE status = 'active' AND credential_version = $credentialVersion RETURN AFTER)[0];
     LET $created = IF $current IS NONE THEN NONE ELSE (
       CREATE type::record('account_authenticator', $authenticatorId) CONTENT $content RETURN AFTER
     )[0] END;
     COMMIT TRANSACTION;
     RETURN $created;`,
      {
        account,
        credentialVersion: output.credentialVersion,
        authenticatorId: output.id,
        content: {
          account,
          kind: 'passkey',
          purpose: 'primary',
          status: 'active',
          identifier: output.credentialId,
          public_key: output.publicKey,
          verified_at: new Date(),
          metadata: {
            webauthn_user_id: output.webauthnUserId,
            counter: output.counter,
            transports: output.transports,
            device_type: output.deviceType,
            backed_up: output.backedUp,
            ...(output.label ? { label: output.label } : {}),
          },
        },
      },
    )
    .json();
  const authenticator = results.at(-1) as AccountAuthenticator | null | undefined;
  return authenticator
    ? { success: true, data: authenticator }
    : authenticationError('error.auth.transaction.state_conflict');
}

/** Stores a verified WebAuthn signature counter only when it is monotonic. */
export async function touchPasskeyAuthenticator(
  db: Surreal,
  input: unknown,
): Promise<DataManagerResult<AccountAuthenticator>> {
  const parsed = v.safeParse(TouchPasskeyAuthenticatorInputSchema, input);
  if (!parsed.success) return invalidInput(parsed.issues);

  const authenticator = await querySingle<AccountAuthenticator>(
    db,
    `
      UPDATE $authenticator SET metadata.counter = $counter, metadata.last_used_at = time::now()
      WHERE kind = 'passkey'
        AND status = 'active'
        AND (
          (metadata.counter = 0 AND $counter = 0)
          OR $counter > metadata.counter
        )
      RETURN AFTER;
    `,
    {
      authenticator: recordId('account_authenticator', parsed.output.id),
      counter: parsed.output.counter,
    },
  );
  return authenticator
    ? { success: true, data: authenticator }
    : authenticationError('error.auth.transaction.invalid');
}
