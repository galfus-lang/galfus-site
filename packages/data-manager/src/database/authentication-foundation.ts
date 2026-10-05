import type { Surreal } from 'surrealdb';
import { RecordId } from 'surrealdb';
import * as v from 'valibot';

import type {
  AccountFederatedIdentity,
  AuthOtpChallenge,
  AuthSession,
  AuthTransaction,
  BelongsTo,
  OrganizationInvitation,
} from '../generated';
import { authenticationError, invalidInput, type DataManagerResult } from '../errors';
import {
  AdvanceAuthTransactionInputSchema,
  CompleteAuthTransactionInputSchema,
  ConsumeInvitationWithMembershipInputSchema,
  ConsumeOtpChallengeInputSchema,
  CreateInvitationInputSchema,
  CreateOrLinkFederatedIdentityInputSchema,
  CreateOtpChallengeInputSchema,
  CreateSessionInputSchema,
  GetAuthTransactionInputSchema,
  GetInvitationForAcceptanceInputSchema,
  GetSessionInputSchema,
  RevokeMembershipFromWebhookInputSchema,
  RevokeOrganizationAccessInputSchema,
  RevokeSessionInputSchema,
  StartAuthTransactionInputSchema,
  TouchSessionInputSchema,
} from '../inputs/auth-foundation';

type TransactionView = Pick<
  AuthTransaction,
  | 'id'
  | 'intent'
  | 'status'
  | 'account'
  | 'organization'
  | 'invitation'
  | 'ssoConnection'
  | 'returnTo'
  | 'primaryMethod'
  | 'pendingMfaMethod'
  | 'attempts'
  | 'maxAttempts'
  | 'expiresAt'
  | 'consumedAt'
  | 'version'
>;

export type InvitationForAcceptance = Pick<
  OrganizationInvitation,
  'id' | 'organization' | 'ssoConnection' | 'role' | 'targetEmail' | 'expiresAt'
>;

const transactionTransitions = {
  pending: ['awaiting_sso', 'awaiting_primary', 'authorized', 'failed'],
  awaiting_sso: ['awaiting_primary', 'awaiting_mfa', 'authorized', 'failed'],
  awaiting_primary: ['awaiting_mfa', 'authorized', 'failed'],
  awaiting_mfa: ['authorized', 'failed'],
  authorized: ['completed', 'failed'],
  completed: [],
  failed: [],
  expired: [],
} as const;

function recordId<T extends string>(table: T, id: string): RecordId<T> {
  return new RecordId(table, id);
}

function optionalRecordId<T extends string>(table: T, id?: string | null): RecordId<T> | undefined {
  return id ? recordId(table, id) : undefined;
}

function asDate(value: string): Date {
  return new Date(value);
}

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
): Promise<DataManagerResult<TransactionView>> {
  const parsed = v.safeParse(StartAuthTransactionInputSchema, input);
  if (!parsed.success) return invalidInput(parsed.issues);

  const output = parsed.output;
  const content = {
    intent: output.intent,
    status: output.status,
    browserVerifierHash: output.browserVerifierHash,
    expiresAt: asDate(output.expiresAt),
    ...(optionalRecordId('account', output.accountId) && {
      account: optionalRecordId('account', output.accountId),
    }),
    ...(optionalRecordId('organization', output.organizationId) && {
      organization: optionalRecordId('organization', output.organizationId),
    }),
    ...(optionalRecordId('organization_invitation', output.invitationId) && {
      invitation: optionalRecordId('organization_invitation', output.invitationId),
    }),
    ...(optionalRecordId('organization_sso_connection', output.ssoConnectionId) && {
      ssoConnection: optionalRecordId('organization_sso_connection', output.ssoConnectionId),
    }),
    ...(output.returnTo ? { returnTo: output.returnTo } : {}),
    ...(output.pendingMfaMethod ? { pendingMfaMethod: output.pendingMfaMethod } : {}),
  };

  const transaction = await querySingle<AuthTransaction>(
    db,
    'CREATE $transaction CONTENT $content RETURN AFTER;',
    { transaction: transactionRecordId(output.id), content },
  );

  if (!transaction) throw new Error('SurrealDB did not create the authorization transaction.');
  return { success: true, data: transaction };
}

/** Reads an active transaction only when the browser verifier still matches. */
export async function getAuthTransaction(
  db: Surreal,
  input: unknown,
): Promise<DataManagerResult<TransactionView>> {
  const parsed = v.safeParse(GetAuthTransactionInputSchema, input);
  if (!parsed.success) return invalidInput(parsed.issues);

  const transaction = await querySingle<TransactionView>(
    db,
    `
      SELECT id, intent, status, account, organization, invitation, ssoConnection,
        returnTo, primaryMethod, pendingMfaMethod, attempts, maxAttempts,
        expiresAt, consumedAt, version
      FROM $transaction
      WHERE browserVerifierHash = $browserVerifierHash
        AND expiresAt > time::now()
        AND consumedAt IS NONE
      LIMIT 1;
    `,
    {
      transaction: transactionRecordId(parsed.output.id),
      browserVerifierHash: parsed.output.browserVerifierHash,
    },
  );

  return transaction
    ? { success: true, data: transaction }
    : transactionErrorForStatus('invalid');
}

/** Advances exactly one expected transaction state using optimistic concurrency. */
export async function advanceAuthTransaction(
  db: Surreal,
  input: unknown,
): Promise<DataManagerResult<TransactionView>> {
  const parsed = v.safeParse(AdvanceAuthTransactionInputSchema, input);
  if (!parsed.success) return invalidInput(parsed.issues);

  const output = parsed.output;
  if (!transactionTransitions[output.expectedStatus].includes(output.nextStatus as never)) {
    return authenticationError('error.auth.transaction.state_conflict');
  }

  const assignments = ['status = $nextStatus', 'version = version + 1'];
  const bindings: Record<string, unknown> = {
    transaction: transactionRecordId(output.id),
    browserVerifierHash: output.browserVerifierHash,
    expectedStatus: output.expectedStatus,
    expectedVersion: output.expectedVersion,
    nextStatus: output.nextStatus,
  };

  if (output.incrementAttempts) assignments.push('attempts = attempts + 1');
  for (const field of [
    'primaryMethod',
    'pendingMfaMethod',
    'oidcStateHash',
    'oidcNonceHash',
    'pkceVerifierCiphertext',
  ] as const) {
    if (typeof output[field] === 'string') {
      assignments.push(`${field} = $${field}`);
      bindings[field] = output[field];
    }
  }
  if (output.accountId) {
    assignments.push('account = $account');
    bindings.account = recordId('account', output.accountId);
  }

  const transaction = await querySingle<TransactionView>(
    db,
    `
      UPDATE $transaction SET ${assignments.join(', ')}
      WHERE browserVerifierHash = $browserVerifierHash
        AND status = $expectedStatus
        AND version = $expectedVersion
        AND expiresAt > time::now()
        AND consumedAt IS NONE
      RETURN AFTER;
    `,
    bindings,
  );

  return transaction
    ? { success: true, data: transaction }
    : authenticationError('error.auth.transaction.state_conflict');
}

/** Consumes an authorized transaction and creates its opaque server session atomically. */
export async function completeAuthTransaction(
  db: Surreal,
  input: unknown,
): Promise<DataManagerResult<AuthSession>> {
  const parsed = v.safeParse(CompleteAuthTransactionInputSchema, input);
  if (!parsed.success) return invalidInput(parsed.issues);

  const output = parsed.output;
  const sessionContent = {
    account: recordId('account', output.accountId),
    tokenPrefix: output.sessionTokenPrefix,
    tokenHash: output.sessionTokenHash,
    expiresAt: asDate(output.sessionExpiresAt),
    ...(output.sessionIdleExpiresAt ? { idleExpiresAt: asDate(output.sessionIdleExpiresAt) } : {}),
  };

  const results = await db
    .query<unknown[]>(
      `
        BEGIN TRANSACTION;
        LET $authorization = (
          UPDATE $transactionRecord
          SET status = 'completed', consumedAt = time::now(), version = version + 1
          WHERE browserVerifierHash = $browserVerifierHash
            AND status = $expectedStatus
            AND version = $expectedVersion
            AND account = $account
            AND expiresAt > time::now()
            AND consumedAt IS NONE
          RETURN AFTER
        )[0];
        LET $createdSession = IF $authorization IS NOT NONE THEN
          (CREATE $sessionRecord CONTENT $sessionContent)[0]
        ELSE NONE END;
        COMMIT TRANSACTION;
        RETURN $createdSession;
      `,
      {
        transactionRecord: transactionRecordId(output.id),
        browserVerifierHash: output.browserVerifierHash,
        expectedStatus: output.expectedStatus,
        expectedVersion: output.expectedVersion,
        account: recordId('account', output.accountId),
        sessionRecord: recordId('auth_session', output.sessionId),
        sessionContent,
      },
    )
    .json();

  const session = results.at(-1) as AuthSession | null | undefined;
  return session
    ? { success: true, data: session }
    : authenticationError('error.auth.transaction.state_conflict');
}

export async function createInvitation(
  db: Surreal,
  input: unknown,
): Promise<DataManagerResult<OrganizationInvitation>> {
  const parsed = v.safeParse(CreateInvitationInputSchema, input);
  if (!parsed.success) return invalidInput(parsed.issues);

  const output = parsed.output;
  const content = {
    organization: recordId('organization', output.organizationId),
    createdBy: recordId('account', output.createdByAccountId),
    tokenHash: output.tokenHash,
    expiresAt: asDate(output.expiresAt),
    role: output.role,
    ...(output.targetEmail ? { targetEmail: output.targetEmail } : {}),
    ...(optionalRecordId('organization_sso_connection', output.ssoConnectionId) && {
      ssoConnection: optionalRecordId('organization_sso_connection', output.ssoConnectionId),
    }),
  };
  const invitation = await querySingle<OrganizationInvitation>(
    db,
    'CREATE $invitation CONTENT $content RETURN AFTER;',
    { invitation: recordId('organization_invitation', output.id), content },
  );
  if (!invitation) throw new Error('SurrealDB did not create the invitation.');
  return { success: true, data: invitation };
}

export async function getInvitationForAcceptance(
  db: Surreal,
  input: unknown,
): Promise<DataManagerResult<InvitationForAcceptance>> {
  const parsed = v.safeParse(GetInvitationForAcceptanceInputSchema, input);
  if (!parsed.success) return invalidInput(parsed.issues);

  const invitation = await querySingle<InvitationForAcceptance>(
    db,
    `
      SELECT id, organization, ssoConnection, role, targetEmail, expiresAt
      FROM $invitation
      WHERE tokenHash = $tokenHash
        AND expiresAt > time::now()
        AND consumedAt IS NONE
        AND revokedAt IS NONE
      LIMIT 1;
    `,
    { invitation: recordId('organization_invitation', parsed.output.id), tokenHash: parsed.output.tokenHash },
  );

  return invitation
    ? { success: true, data: invitation }
    : authenticationError('error.auth.invitation.invalid');
}

/** Consumes a valid invitation and creates its membership in one database transaction. */
export async function consumeInvitationWithMembership(
  db: Surreal,
  input: unknown,
): Promise<DataManagerResult<BelongsTo>> {
  const parsed = v.safeParse(ConsumeInvitationWithMembershipInputSchema, input);
  if (!parsed.success) return invalidInput(parsed.issues);

  const output = parsed.output;
  const account = recordId('account', output.accountId);
  const results = await db
    .query<unknown[]>(
      `
        BEGIN TRANSACTION;
        LET $invitation = (
          UPDATE $invitationRecord
          SET consumedAt = time::now(), consumedBy = $account
          WHERE tokenHash = $tokenHash
            AND expiresAt > time::now()
            AND consumedAt IS NONE
            AND revokedAt IS NONE
          RETURN AFTER
        )[0];
        LET $organization = $invitation.organization;
        RELATE $account->$membershipRecord->$organization SET
          role = $invitation.role,
          status = $membershipStatus,
          origin = 'invite',
          invitation = $invitation.id,
          ssoConnection = $invitation.ssoConnection,
          activatedAt = IF $membershipStatus = 'active' THEN time::now() ELSE NONE END;
        COMMIT TRANSACTION;
        SELECT * FROM $membershipRecord;
      `,
      {
        invitationRecord: recordId('organization_invitation', output.id),
        tokenHash: output.tokenHash,
        account,
        membershipRecord: recordId('belongs_to', output.membershipId),
        membershipStatus: output.membershipStatus,
      },
    )
    .json();

  const memberships = results.at(-1) as BelongsTo[] | undefined;
  return memberships?.[0]
    ? { success: true, data: memberships[0] }
    : authenticationError('error.auth.invitation.invalid');
}

export async function createSession(
  db: Surreal,
  input: unknown,
): Promise<DataManagerResult<AuthSession>> {
  const parsed = v.safeParse(CreateSessionInputSchema, input);
  if (!parsed.success) return invalidInput(parsed.issues);

  const output = parsed.output;
  const content = {
    account: recordId('account', output.accountId),
    tokenPrefix: output.tokenPrefix,
    tokenHash: output.tokenHash,
    expiresAt: asDate(output.expiresAt),
    ...(output.idleExpiresAt ? { idleExpiresAt: asDate(output.idleExpiresAt) } : {}),
  };
  const session = await querySingle<AuthSession>(
    db,
    'CREATE $session CONTENT $content RETURN AFTER;',
    { session: recordId('auth_session', output.id), content },
  );
  if (!session) throw new Error('SurrealDB did not create the authentication session.');
  return { success: true, data: session };
}

export async function getSession(
  db: Surreal,
  input: unknown,
): Promise<DataManagerResult<AuthSession>> {
  const parsed = v.safeParse(GetSessionInputSchema, input);
  if (!parsed.success) return invalidInput(parsed.issues);

  const session = await querySingle<AuthSession>(
    db,
    `
      SELECT * FROM auth_session
      WHERE tokenPrefix = $tokenPrefix
        AND tokenHash = $tokenHash
        AND revokedAt IS NONE
        AND expiresAt > time::now()
        AND (idleExpiresAt IS NONE OR idleExpiresAt > time::now())
      LIMIT 1;
    `,
    parsed.output,
  );
  return session ? { success: true, data: session } : authenticationError('error.auth.session.invalid');
}

export async function revokeSession(
  db: Surreal,
  input: unknown,
): Promise<DataManagerResult<AuthSession>> {
  const parsed = v.safeParse(RevokeSessionInputSchema, input);
  if (!parsed.success) return invalidInput(parsed.issues);

  const session = await querySingle<AuthSession>(
    db,
    `
      UPDATE $session SET revokedAt = time::now(), revokeReason = $reason
      WHERE revokedAt IS NONE
      RETURN AFTER;
    `,
    { session: recordId('auth_session', parsed.output.id), reason: parsed.output.reason },
  );
  return session ? { success: true, data: session } : authenticationError('error.auth.session.invalid');
}

/** Updates activity only for a still-valid server session. */
export async function touchSession(
  db: Surreal,
  input: unknown,
): Promise<DataManagerResult<AuthSession>> {
  const parsed = v.safeParse(TouchSessionInputSchema, input);
  if (!parsed.success) return invalidInput(parsed.issues);

  const output = parsed.output;
  const session = await querySingle<AuthSession>(
    db,
    `
      UPDATE $session
      SET lastUsedAt = time::now(), idleExpiresAt = $idleExpiresAt
      WHERE revokedAt IS NONE
        AND expiresAt > time::now()
        AND (idleExpiresAt IS NONE OR idleExpiresAt > time::now())
      RETURN AFTER;
    `,
    {
      session: recordId('auth_session', output.id),
      idleExpiresAt: output.idleExpiresAt ? asDate(output.idleExpiresAt) : undefined,
    },
  );
  return session ? { success: true, data: session } : authenticationError('error.auth.session.invalid');
}

/** Revokes one account's access to one organization without changing its global account/session. */
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
      SET status = 'revoked', revokedAt = time::now(), revokedReason = $reason
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

export async function createOrLinkFederatedIdentity(
  db: Surreal,
  input: unknown,
): Promise<DataManagerResult<AccountFederatedIdentity>> {
  const parsed = v.safeParse(CreateOrLinkFederatedIdentityInputSchema, input);
  if (!parsed.success) return invalidInput(parsed.issues);

  const output = parsed.output;
  const existing = await querySingle<AccountFederatedIdentity>(
    db,
    `
      SELECT * FROM account_federated_identity
      WHERE connection = $connection AND issuer = $issuer AND subject = $subject
      LIMIT 1;
    `,
    {
      connection: recordId('organization_sso_connection', output.connectionId),
      issuer: output.issuer,
      subject: output.subject,
    },
  );
  if (existing) return { success: true, data: existing };

  const identity = await querySingle<AccountFederatedIdentity>(
    db,
    'CREATE $identity CONTENT $content RETURN AFTER;',
    {
      identity: recordId('account_federated_identity', output.id),
      content: {
        account: recordId('account', output.accountId),
        connection: recordId('organization_sso_connection', output.connectionId),
        issuer: output.issuer,
        subject: output.subject,
        metadata: output.metadata,
      },
    },
  );
  if (!identity) throw new Error('SurrealDB did not create the federated identity.');
  return { success: true, data: identity };
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
  const identity = await querySingle<Pick<AccountFederatedIdentity, 'account'>>(
    db,
    `
      SELECT account FROM account_federated_identity
      WHERE connection = $connection AND issuer = $issuer AND subject = $subject
      LIMIT 1;
    `,
    { connection, issuer: output.issuer, subject: output.subject },
  );
  if (!identity) return authenticationError('error.auth.invitation.invalid');

  const membership = await querySingle<BelongsTo>(
    db,
    `
      UPDATE belongs_to
      SET status = 'revoked', revokedAt = time::now(), revokedReason = $reason
      WHERE in = $account AND ssoConnection = $connection AND status != 'revoked'
      RETURN AFTER;
    `,
    { account: identity.account, connection, reason: output.reason },
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

  const output = parsed.output;
  const content = {
    purpose: output.purpose,
    codeHash: output.codeHash,
    expiresAt: asDate(output.expiresAt),
    maxAttempts: output.maxAttempts,
    ...(optionalRecordId('account', output.accountId) && {
      account: optionalRecordId('account', output.accountId),
    }),
    ...(optionalRecordId('account_contact', output.contactId) && {
      contact: optionalRecordId('account_contact', output.contactId),
    }),
  };
  const challenge = await querySingle<AuthOtpChallenge>(
    db,
    'CREATE $challenge CONTENT $content RETURN AFTER;',
    { challenge: recordId('auth_otp_challenge', output.id), content },
  );
  if (!challenge) throw new Error('SurrealDB did not create the OTP challenge.');
  return { success: true, data: challenge };
}

/** Consumes a matching OTP hash once, incrementing attempts for invalid codes is handled by callers. */
export async function consumeOtpChallenge(
  db: Surreal,
  input: unknown,
): Promise<DataManagerResult<AuthOtpChallenge>> {
  const parsed = v.safeParse(ConsumeOtpChallengeInputSchema, input);
  if (!parsed.success) return invalidInput(parsed.issues);

  const challenge = await querySingle<AuthOtpChallenge>(
    db,
    `
      UPDATE $challenge SET consumedAt = time::now()
      WHERE codeHash = $codeHash
        AND expiresAt > time::now()
        AND consumedAt IS NONE
        AND attempts < maxAttempts
      RETURN AFTER;
    `,
    { challenge: recordId('auth_otp_challenge', parsed.output.id), codeHash: parsed.output.codeHash },
  );
  return challenge ? { success: true, data: challenge } : authenticationError('error.auth.otp.invalid');
}
