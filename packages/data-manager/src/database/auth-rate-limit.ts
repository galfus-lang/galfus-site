import type { Surreal } from 'surrealdb';
import * as v from 'valibot';
import { invalidInput, type DataManagerResult } from '../errors';

const schema = v.object({
  scope: v.picklist(['login', 'recovery', 'mfa']),
  accountHash: v.pipe(v.string(), v.regex(/^[A-Za-z0-9_-]{43}$/)),
  addressHash: v.pipe(v.string(), v.regex(/^[A-Za-z0-9_-]{43}$/)),
});

/** Limit password attempts across browser transactions and network addresses. */
export async function reservePasswordAttempt(
  db: Surreal,
  input: unknown,
): Promise<DataManagerResult<boolean>> {
  const parsed = v.safeParse(schema, input);
  if (!parsed.success) return invalidInput(parsed.issues);
  const attempt = () =>
    db
      .query<unknown[]>(
        `
    BEGIN TRANSACTION;
    LET $accountRecord = type::record('auth_transaction', string::concat('rate_', $scope, '_account_', $accountHash));
    LET $addressRecord = type::record('auth_transaction', string::concat('rate_', $scope, '_address_', $addressHash));
    LET $accountGuard = (SELECT * FROM $accountRecord LIMIT 1)[0];
    LET $addressGuard = (SELECT * FROM $addressRecord LIMIT 1)[0];
    LET $accountLimit = IF $scope = 'recovery' THEN 3 ELSE 10 END;
    LET $addressLimit = IF $scope = 'recovery' THEN 20 ELSE 60 END;
    LET $allowed = ($accountGuard IS NONE OR $accountGuard.expires_at <= time::now() OR $accountGuard.attempts < $accountLimit)
      AND ($addressGuard IS NONE OR $addressGuard.expires_at <= time::now() OR $addressGuard.attempts < $addressLimit);
    IF $allowed THEN (UPSERT $accountRecord SET kind = 'authorization', status = 'pending',
      attempts = IF $accountGuard IS NONE OR $accountGuard.expires_at <= time::now() THEN 1 ELSE $accountGuard.attempts + 1 END,
      expires_at = IF $accountGuard IS NONE OR $accountGuard.expires_at <= time::now() THEN time::now() + 15m ELSE $accountGuard.expires_at END) END;
    IF $allowed THEN (UPSERT $addressRecord SET kind = 'authorization', status = 'pending',
      attempts = IF $addressGuard IS NONE OR $addressGuard.expires_at <= time::now() THEN 1 ELSE $addressGuard.attempts + 1 END,
      expires_at = IF $addressGuard IS NONE OR $addressGuard.expires_at <= time::now() THEN time::now() + 15m ELSE $addressGuard.expires_at END) END;
    COMMIT TRANSACTION;
    RETURN $allowed;
  `,
        parsed.output,
      )
      .json();
  try {
    const result = await attempt();
    return { success: true, data: result.at(-1) === true };
  } catch (error) {
    if (
      !(error instanceof Error) ||
      !error.message.includes('query was not executed due to a failed transaction')
    )
      throw error;
    // A contending request has already consumed a slot; reject rather than bypass the limit.
    return { success: true, data: false };
  }
}
