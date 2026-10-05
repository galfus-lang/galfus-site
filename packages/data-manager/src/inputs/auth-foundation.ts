import * as v from 'valibot';

const RecordIdSchema = v.pipe(
  v.string('error.input.invalid'),
  v.trim(),
  v.minLength(1, 'error.input.invalid'),
  v.maxLength(255, 'error.input.invalid'),
);

const PublicIdSchema = v.pipe(
  v.string('error.input.invalid'),
  v.regex(/^[0-9A-HJKMNP-TV-Z]{26}$/, 'error.input.invalid'),
);

const SecretHashSchema = v.pipe(
  v.string('error.input.invalid'),
  v.regex(/^[A-Za-z0-9_-]{43}$/, 'error.input.invalid'),
);

const DateTimeSchema = v.pipe(
  v.string('error.input.invalid'),
  v.isoTimestamp('error.input.invalid'),
);

const OptionalRecordIdSchema = v.optional(v.nullable(RecordIdSchema));
const OptionalStringSchema = v.optional(v.nullable(v.string('error.input.invalid')));

export const AuthTransactionIntentSchema = v.picklist([
  'login',
  'register',
  'invite',
  'recovery',
  'upsert_password',
]);
export type AuthTransactionIntent = v.InferOutput<typeof AuthTransactionIntentSchema>;

export const AuthTransactionStatusSchema = v.picklist([
  'pending',
  'awaiting_sso',
  'awaiting_primary',
  'awaiting_mfa',
  'authorized',
  'completed',
  'failed',
  'expired',
]);
export type AuthTransactionStatus = v.InferOutput<typeof AuthTransactionStatusSchema>;

export const StartAuthTransactionInputSchema = v.object({
  id: PublicIdSchema,
  browserVerifierHash: SecretHashSchema,
  intent: AuthTransactionIntentSchema,
  status: AuthTransactionStatusSchema,
  expiresAt: DateTimeSchema,
  accountId: OptionalRecordIdSchema,
  organizationId: OptionalRecordIdSchema,
  invitationId: OptionalRecordIdSchema,
  ssoConnectionId: OptionalRecordIdSchema,
  returnTo: OptionalStringSchema,
  pendingMfaMethod: OptionalStringSchema,
});

export const GetAuthTransactionInputSchema = v.object({
  id: PublicIdSchema,
  browserVerifierHash: SecretHashSchema,
});

export const AdvanceAuthTransactionInputSchema = v.object({
  id: PublicIdSchema,
  browserVerifierHash: SecretHashSchema,
  expectedStatus: AuthTransactionStatusSchema,
  expectedVersion: v.pipe(v.number('error.input.invalid'), v.integer('error.input.invalid'), v.minValue(0, 'error.input.invalid')),
  nextStatus: AuthTransactionStatusSchema,
  primaryMethod: OptionalStringSchema,
  pendingMfaMethod: OptionalStringSchema,
  oidcStateHash: OptionalStringSchema,
  oidcNonceHash: OptionalStringSchema,
  pkceVerifierCiphertext: OptionalStringSchema,
  accountId: OptionalRecordIdSchema,
  incrementAttempts: v.optional(v.boolean('error.input.invalid'), false),
});

export const CompleteAuthTransactionInputSchema = v.object({
  id: PublicIdSchema,
  browserVerifierHash: SecretHashSchema,
  expectedStatus: v.picklist(['authorized', 'awaiting_mfa']),
  expectedVersion: v.pipe(v.number('error.input.invalid'), v.integer('error.input.invalid'), v.minValue(0, 'error.input.invalid')),
  accountId: RecordIdSchema,
  sessionId: PublicIdSchema,
  sessionTokenPrefix: v.pipe(v.string('error.input.invalid'), v.regex(/^[A-Za-z0-9_-]{16}$/, 'error.input.invalid')),
  sessionTokenHash: SecretHashSchema,
  sessionExpiresAt: DateTimeSchema,
  sessionIdleExpiresAt: v.optional(v.nullable(DateTimeSchema)),
});

export const CreateInvitationInputSchema = v.object({
  id: PublicIdSchema,
  organizationId: RecordIdSchema,
  createdByAccountId: RecordIdSchema,
  tokenHash: SecretHashSchema,
  expiresAt: DateTimeSchema,
  role: v.pipe(v.string('error.input.invalid'), v.trim(), v.minLength(1, 'error.input.invalid')),
  targetEmail: v.optional(v.nullable(v.pipe(v.string('error.input.invalid'), v.trim(), v.toLowerCase(), v.email('error.fields.email.malformed')))),
  ssoConnectionId: OptionalRecordIdSchema,
});

export const GetInvitationForAcceptanceInputSchema = v.object({
  id: PublicIdSchema,
  tokenHash: SecretHashSchema,
});

export const ConsumeInvitationWithMembershipInputSchema = v.object({
  id: PublicIdSchema,
  tokenHash: SecretHashSchema,
  accountId: RecordIdSchema,
  membershipId: PublicIdSchema,
  membershipStatus: v.picklist(['pending_activation', 'active']),
});

export const CreateSessionInputSchema = v.object({
  id: PublicIdSchema,
  accountId: RecordIdSchema,
  tokenPrefix: v.pipe(v.string('error.input.invalid'), v.regex(/^[A-Za-z0-9_-]{16}$/, 'error.input.invalid')),
  tokenHash: SecretHashSchema,
  expiresAt: DateTimeSchema,
  idleExpiresAt: v.optional(v.nullable(DateTimeSchema)),
});

export const GetSessionInputSchema = v.object({
  tokenPrefix: v.pipe(v.string('error.input.invalid'), v.regex(/^[A-Za-z0-9_-]{16}$/, 'error.input.invalid')),
  tokenHash: SecretHashSchema,
});

export const RevokeSessionInputSchema = v.object({
  id: PublicIdSchema,
  reason: v.pipe(v.string('error.input.invalid'), v.trim(), v.minLength(1, 'error.input.invalid')),
});

export const TouchSessionInputSchema = v.object({
  id: PublicIdSchema,
  idleExpiresAt: v.optional(v.nullable(DateTimeSchema)),
});

export const RevokeOrganizationAccessInputSchema = v.object({
  accountId: RecordIdSchema,
  organizationId: RecordIdSchema,
  reason: v.pipe(v.string('error.input.invalid'), v.trim(), v.minLength(1, 'error.input.invalid')),
});

export const CreateOrLinkFederatedIdentityInputSchema = v.object({
  id: PublicIdSchema,
  accountId: RecordIdSchema,
  connectionId: RecordIdSchema,
  issuer: v.pipe(v.string('error.input.invalid'), v.trim(), v.url('error.input.invalid')),
  subject: v.pipe(v.string('error.input.invalid'), v.trim(), v.minLength(1, 'error.input.invalid')),
  metadata: v.optional(v.record(v.string(), v.unknown()), {}),
});

export const RevokeMembershipFromWebhookInputSchema = v.object({
  connectionId: RecordIdSchema,
  issuer: v.pipe(v.string('error.input.invalid'), v.trim(), v.url('error.input.invalid')),
  subject: v.pipe(v.string('error.input.invalid'), v.trim(), v.minLength(1, 'error.input.invalid')),
  reason: v.pipe(v.string('error.input.invalid'), v.trim(), v.minLength(1, 'error.input.invalid')),
});

export const CreateOtpChallengeInputSchema = v.object({
  id: PublicIdSchema,
  purpose: v.picklist(['verify_contact', 'mfa', 'recovery']),
  codeHash: SecretHashSchema,
  expiresAt: DateTimeSchema,
  accountId: OptionalRecordIdSchema,
  contactId: OptionalRecordIdSchema,
  maxAttempts: v.optional(v.pipe(v.number('error.input.invalid'), v.integer('error.input.invalid'), v.minValue(1, 'error.input.invalid'), v.maxValue(10, 'error.input.invalid')), 5),
});

export const ConsumeOtpChallengeInputSchema = v.object({
  id: PublicIdSchema,
  codeHash: SecretHashSchema,
});

export const CreateAccountContactInputSchema = v.object({
  id: PublicIdSchema,
  accountId: RecordIdSchema,
  type: v.picklist(['email', 'phone']),
  value: v.pipe(v.string('error.input.invalid'), v.trim(), v.minLength(3, 'error.input.invalid'), v.maxLength(254, 'error.input.invalid')),
});

export const VerifyAccountContactInputSchema = v.object({
  id: PublicIdSchema,
  accountId: RecordIdSchema,
});

export const CreateMfaFactorInputSchema = v.object({
  id: PublicIdSchema,
  accountId: RecordIdSchema,
  type: v.picklist(['totp', 'email_otp', 'sms_otp']),
  secretCiphertext: OptionalStringSchema,
  label: OptionalStringSchema,
});

export const ActivateMfaFactorInputSchema = v.object({
  id: PublicIdSchema,
  accountId: RecordIdSchema,
});

export const CreatePasskeyInputSchema = v.object({
  id: PublicIdSchema,
  accountId: RecordIdSchema,
  credentialId: v.pipe(v.string('error.input.invalid'), v.regex(/^[A-Za-z0-9_-]+$/, 'error.input.invalid')),
  webauthnUserId: v.pipe(v.string('error.input.invalid'), v.regex(/^[A-Za-z0-9_-]+$/, 'error.input.invalid')),
  publicKey: v.pipe(v.string('error.input.invalid'), v.regex(/^[A-Za-z0-9_-]+$/, 'error.input.invalid')),
  counter: v.pipe(v.number('error.input.invalid'), v.integer('error.input.invalid'), v.minValue(0, 'error.input.invalid')),
  transports: v.optional(v.array(v.string('error.input.invalid')), []),
  deviceType: v.picklist(['singleDevice', 'multiDevice']),
  backedUp: v.boolean('error.input.invalid'),
  label: OptionalStringSchema,
});

export const TouchPasskeyInputSchema = v.object({
  id: PublicIdSchema,
  counter: v.pipe(v.number('error.input.invalid'), v.integer('error.input.invalid'), v.minValue(0, 'error.input.invalid')),
});
