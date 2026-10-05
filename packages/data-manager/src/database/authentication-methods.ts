import type { Surreal } from 'surrealdb';
import { RecordId } from 'surrealdb';
import * as v from 'valibot';

import type { AccountContact, AccountMfaFactor, AccountPasskey } from '../generated';
import { authenticationError, invalidInput, type DataManagerResult } from '../errors';
import {
  ActivateMfaFactorInputSchema,
  CreateAccountContactInputSchema,
  CreateMfaFactorInputSchema,
  CreatePasskeyInputSchema,
  TouchPasskeyInputSchema,
  VerifyAccountContactInputSchema,
} from '../inputs/auth-foundation';

function recordId<T extends string>(table: T, id: string): RecordId<T> {
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

export async function createAccountContact(
  db: Surreal,
  input: unknown,
): Promise<DataManagerResult<AccountContact>> {
  const parsed = v.safeParse(CreateAccountContactInputSchema, input);
  if (!parsed.success) return invalidInput(parsed.issues);

  const output = parsed.output;
  const contact = await querySingle<AccountContact>(
    db,
    'CREATE $contact CONTENT $content RETURN AFTER;',
    {
      contact: recordId('account_contact', output.id),
      content: {
        account: recordId('account', output.accountId),
        type: output.type,
        value: output.type === 'email' ? output.value.toLowerCase() : output.value,
      },
    },
  );
  if (!contact) throw new Error('SurrealDB did not create the account contact.');
  return { success: true, data: contact };
}

export async function verifyAccountContact(
  db: Surreal,
  input: unknown,
): Promise<DataManagerResult<AccountContact>> {
  const parsed = v.safeParse(VerifyAccountContactInputSchema, input);
  if (!parsed.success) return invalidInput(parsed.issues);

  const contact = await querySingle<AccountContact>(
    db,
    `
      UPDATE $contact SET status = 'active', verifiedAt = time::now()
      WHERE account = $account AND status = 'pending'
      RETURN AFTER;
    `,
    {
      contact: recordId('account_contact', parsed.output.id),
      account: recordId('account', parsed.output.accountId),
    },
  );
  return contact ? { success: true, data: contact } : authenticationError('error.auth.otp.invalid');
}

export async function createMfaFactor(
  db: Surreal,
  input: unknown,
): Promise<DataManagerResult<AccountMfaFactor>> {
  const parsed = v.safeParse(CreateMfaFactorInputSchema, input);
  if (!parsed.success) return invalidInput(parsed.issues);

  const output = parsed.output;
  const factor = await querySingle<AccountMfaFactor>(
    db,
    'CREATE $factor CONTENT $content RETURN AFTER;',
    {
      factor: recordId('account_mfa_factor', output.id),
      content: {
        account: recordId('account', output.accountId),
        type: output.type,
        ...(output.secretCiphertext ? { secretCiphertext: output.secretCiphertext } : {}),
        ...(output.label ? { label: output.label } : {}),
      },
    },
  );
  if (!factor) throw new Error('SurrealDB did not create the MFA factor.');
  return { success: true, data: factor };
}

/** Activates a verified account-level MFA factor and marks the account MFA-enabled atomically. */
export async function activateMfaFactor(
  db: Surreal,
  input: unknown,
): Promise<DataManagerResult<AccountMfaFactor>> {
  const parsed = v.safeParse(ActivateMfaFactorInputSchema, input);
  if (!parsed.success) return invalidInput(parsed.issues);

  const factorRecord = recordId('account_mfa_factor', parsed.output.id);
  const account = recordId('account', parsed.output.accountId);
  const results = await db
    .query<unknown[]>(
      `
        BEGIN TRANSACTION;
        LET $factor = (
          UPDATE $factor SET status = 'active', verifiedAt = time::now()
          WHERE account = $account AND status = 'pending'
          RETURN AFTER
        )[0];
        LET $accountUpdate = IF $factor IS NOT NONE THEN
          (UPDATE $account SET mfaEnabled = true)[0]
        ELSE NONE END;
        COMMIT TRANSACTION;
        RETURN $factor;
      `,
      { factor: factorRecord, account },
    )
    .json();
  const factor = results.at(-1) as AccountMfaFactor | null | undefined;
  return factor
    ? { success: true, data: factor }
    : authenticationError('error.auth.otp.invalid');
}

export async function createPasskey(
  db: Surreal,
  input: unknown,
): Promise<DataManagerResult<AccountPasskey>> {
  const parsed = v.safeParse(CreatePasskeyInputSchema, input);
  if (!parsed.success) return invalidInput(parsed.issues);

  const output = parsed.output;
  const passkey = await querySingle<AccountPasskey>(
    db,
    'CREATE $passkey CONTENT $content RETURN AFTER;',
    {
      passkey: recordId('account_passkey', output.id),
      content: {
        account: recordId('account', output.accountId),
        credentialId: output.credentialId,
        webauthnUserId: output.webauthnUserId,
        publicKey: output.publicKey,
        counter: output.counter,
        transports: output.transports,
        deviceType: output.deviceType,
        backedUp: output.backedUp,
        ...(output.label ? { label: output.label } : {}),
      },
    },
  );
  if (!passkey) throw new Error('SurrealDB did not create the passkey.');
  return { success: true, data: passkey };
}

/** Stores the WebAuthn signature counter after a verified assertion. */
export async function touchPasskey(
  db: Surreal,
  input: unknown,
): Promise<DataManagerResult<AccountPasskey>> {
  const parsed = v.safeParse(TouchPasskeyInputSchema, input);
  if (!parsed.success) return invalidInput(parsed.issues);

  const passkey = await querySingle<AccountPasskey>(
    db,
    `
      UPDATE $passkey SET counter = $counter, lastUsedAt = time::now()
      WHERE counter <= $counter
      RETURN AFTER;
    `,
    { passkey: recordId('account_passkey', parsed.output.id), counter: parsed.output.counter },
  );
  return passkey ? { success: true, data: passkey } : authenticationError('error.auth.transaction.invalid');
}
