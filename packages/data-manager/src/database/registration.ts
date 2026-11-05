import type { Surreal } from 'surrealdb';
import { RecordId } from 'surrealdb';
import * as v from 'valibot';
import { authenticationError, conflict, invalidInput, type DataManagerResult } from '../errors';
import { parseRegistrationCredentials } from '../inputs/authentication';

const tokenFields = {
  id: v.pipe(v.string(), v.regex(/^[0-9A-HJKMNP-TV-Z]{26}$/)),
  browserVerifierHash: v.pipe(v.string(), v.regex(/^[A-Za-z0-9_-]{43}$/)),
  codeHash: v.pipe(v.string(), v.regex(/^[A-Za-z0-9_-]{43}$/)),
};
const sendSchema = v.object({
  ...tokenFields,
  challengeId: v.pipe(v.string(), v.regex(/^[0-9A-HJKMNP-TV-Z]{26}$/)),
});
const completeSchema = v.object({
  ...tokenFields,
  fullName: v.string(),
  password: v.string(),
  confirmPassword: v.string(),
});

/** Reserve a code before delivery; the browser transaction and address define its scope. */
export async function createRegistrationChallenge(
  db: Surreal,
  input: unknown,
): Promise<DataManagerResult<{ email: string }>> {
  const parsed = v.safeParse(sendSchema, input);
  if (!parsed.success) return invalidInput(parsed.issues);
  const output = parsed.output;
  const reserve = () =>
    db
      .query<unknown[]>(
        `
    BEGIN TRANSACTION;
    LET $tx = (SELECT * FROM $transaction WHERE kind = 'registration'
      AND status = 'awaiting_primary' AND browser_verifier_hash = $verifier
      AND metadata.registration.provider = 'email' AND expires_at > time::now()
      AND consumed_at IS NONE AND attempts < max_attempts LIMIT 1)[0];
    LET $related = IF $tx IS NONE THEN [] ELSE (SELECT VALUE id FROM auth_transaction
      WHERE kind = 'registration' AND metadata.registration.identifier = $tx.metadata.registration.identifier
      AND created_at > time::now() - 1h) END;
    LET $recent = (SELECT id FROM auth_otp_challenge WHERE purpose = 'verify_identity'
      AND transaction IN $related AND created_at > time::now() - 1h);
    LET $last = (SELECT id FROM auth_otp_challenge WHERE purpose = 'verify_identity'
      AND transaction IN $related AND created_at > time::now() - 1m LIMIT 1)[0];
    -- A shared write makes concurrent reservations for the same email conflict.
    LET $guard = IF $tx IS NONE OR $last IS NOT NONE OR array::len($recent) >= 5 THEN NONE ELSE (
      UPSERT type::record('auth_transaction',
        string::concat('resend_', crypto::sha256($tx.metadata.registration.identifier)))
      SET kind = 'registration', status = 'pending', expires_at = time::now() + 1h,
        version += 1 RETURN AFTER
    )[0] END;
    LET $updated = IF $guard IS NONE THEN NONE ELSE (
      UPDATE $transaction SET version = version + 1 WHERE version = $tx.version RETURN AFTER
    )[0] END;
    LET $challenge = IF $updated IS NONE THEN NONE ELSE (
      CREATE $challenge SET transaction = $transaction, purpose = 'verify_identity',
        code_hash = $codeHash, expires_at = time::now() + 10m, max_attempts = 5 RETURN AFTER
    )[0] END;
    IF $challenge IS NOT NONE THEN (
      UPDATE auth_otp_challenge SET consumed_at = time::now()
      WHERE transaction = $transaction AND purpose = 'verify_identity' AND id != $challenge.id
        AND consumed_at IS NONE
    ) END;
    COMMIT TRANSACTION;
    RETURN IF $challenge IS NONE THEN NONE ELSE { email: $tx.metadata.registration.identifier } END;
  `,
        {
          transaction: new RecordId('auth_transaction', output.id),
          challenge: new RecordId('auth_otp_challenge', output.challengeId),
          verifier: output.browserVerifierHash,
          codeHash: output.codeHash,
        },
      )
      .json();
  let results: unknown[];
  try {
    results = await reserve();
  } catch (error) {
    if (
      !(error instanceof Error) ||
      !error.message.includes('query was not executed due to a failed transaction')
    )
      throw error;
    // A conflicting transaction may have just reserved a code. Recheck the window.
    results = await reserve();
  }
  const result = results.at(-1) as { email?: string } | null | undefined;
  return result?.email
    ? { success: true, data: { email: result.email } }
    : authenticationError('error.auth.registration.resend_limited');
}

/** Consume the code and create the verified account in one database transaction. */
export async function completeVerifiedRegistration(
  db: Surreal,
  input: unknown,
): Promise<DataManagerResult<{ accountId: string; returnTo?: string }>> {
  const parsed = v.safeParse(completeSchema, input);
  if (!parsed.success) return invalidInput(parsed.issues);
  const credentials = parseRegistrationCredentials(parsed.output);
  if (!credentials.success) return invalidInput(credentials.issues);
  const output = parsed.output;
  try {
    const results = await db
      .query<unknown[]>(
        `
      BEGIN TRANSACTION;
      LET $tx = (SELECT * FROM $transaction WHERE kind = 'registration' AND status = 'awaiting_primary'
        AND browser_verifier_hash = $verifier AND metadata.registration.provider = 'email'
        AND expires_at > time::now() AND consumed_at IS NONE AND attempts < max_attempts LIMIT 1)[0];
      LET $challenge = IF $tx IS NONE THEN NONE ELSE (UPDATE auth_otp_challenge
        SET consumed_at = time::now() WHERE transaction = $transaction AND purpose = 'verify_identity'
          AND code_hash = $codeHash AND expires_at > time::now() AND consumed_at IS NONE
          AND attempts < max_attempts RETURN AFTER)[0] END;
      LET $account = IF $challenge IS NONE THEN NONE ELSE (CREATE account SET display_name = $fullName)[0] END;
      IF $account IS NOT NONE THEN (CREATE account_authenticator SET account = $account.id,
        kind = 'password', purpose = 'primary', status = 'active',
        secret_hash = crypto::argon2::generate($password), verified_at = time::now()) END;
      IF $account IS NOT NONE THEN (CREATE account_identity SET account = $account.id,
        kind = 'local', provider = 'email', issuer = 'galfus', identifier = $tx.metadata.registration.identifier,
        status = 'active', verified_at = time::now()) END;
      LET $completed = IF $account IS NONE THEN NONE ELSE (UPDATE $transaction SET account = $account.id,
        status = 'completed', consumed_at = time::now(), version = version + 1 RETURN AFTER)[0] END;
      COMMIT TRANSACTION;
      RETURN IF $completed IS NONE THEN NONE ELSE { account: $account.id, return_to: $completed.return_to } END;
    `,
        {
          transaction: new RecordId('auth_transaction', output.id),
          verifier: output.browserVerifierHash,
          codeHash: output.codeHash,
          fullName: credentials.output.fullName,
          password: credentials.output.password,
        },
      )
      .json();
    const result = results.at(-1) as
      { account?: RecordId<'account'>; return_to?: string } | null | undefined;
    if (result?.account)
      return {
        success: true,
        data: {
          accountId: result.account.toString(),
          ...(result.return_to ? { returnTo: result.return_to } : {}),
        },
      };
  } catch (error) {
    if (error instanceof Error && error.message.includes('idx_provider_issuer_identifier'))
      return conflict('account_identity');
    throw error;
  }
  await db
    .query(
      `UPDATE $transaction SET attempts = attempts + 1,
    status = IF attempts + 1 >= max_attempts THEN 'failed' ELSE status END
    WHERE kind = 'registration' AND status = 'awaiting_primary' AND browser_verifier_hash = $verifier
    AND expires_at > time::now() AND consumed_at IS NONE AND attempts < max_attempts;`,
      {
        transaction: new RecordId('auth_transaction', output.id),
        verifier: output.browserVerifierHash,
      },
    )
    .json();
  return authenticationError('error.auth.otp.invalid');
}
