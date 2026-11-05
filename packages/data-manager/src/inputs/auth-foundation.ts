import * as v from 'valibot';

import { parseAuthenticationIdentity } from './authentication';

const RecordIdSchema = v.pipe(
  v.string('error.input.invalid'),
  v.trim(),
  v.minLength(1, 'error.input.invalid'),
  v.maxLength(255, 'error.input.invalid'),
  v.regex(/^(?:[a-z_]+:)?(?:⟨[A-Za-z0-9_-]+⟩|[A-Za-z0-9_-]+)$/, 'error.input.invalid'),
);

const PublicIdSchema = v.pipe(
  v.string('error.input.invalid'),
  v.regex(/^(?:[0-9A-HJKMNP-TV-Z]{26}|[a-z_]+:⟨[0-9A-HJKMNP-TV-Z]{26}⟩)$/, 'error.input.invalid'),
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
const PasswordSchema = v.pipe(
  v.string('error.auth.pass.too_short'),
  v.minLength(8, 'error.auth.pass.too_short'),
  v.maxLength(128, 'error.auth.pass.too_long'),
);
const FederatedSubjectSchema = v.pipe(
  v.string('error.input.invalid'),
  v.trim(),
  v.minLength(1, 'error.input.invalid'),
  v.maxLength(512, 'error.input.invalid'),
);
const FederatedMetadataSchema = v.optional(v.record(v.string(), v.unknown()), {});

export const AuthTransactionKindSchema = v.picklist([
  'authorization',
  'registration',
  'organization_invitation',
  'password_recovery',
  'upsert_password',
]);
export type AuthTransactionKind = v.InferOutput<typeof AuthTransactionKindSchema>;

export const BrowserAuthTransactionKindSchema = v.picklist([
  'authorization',
  'registration',
  'password_recovery',
  'upsert_password',
]);

export const AuthTransactionStatusSchema = v.picklist([
  'pending',
  'awaiting_provider',
  'awaiting_sso',
  'awaiting_primary',
  'awaiting_registration',
  'awaiting_mfa',
  'authorized',
  'completed',
  'failed',
  'revoked',
  'expired',
]);
export type AuthTransactionStatus = v.InferOutput<typeof AuthTransactionStatusSchema>;

/**
 * The database stores transaction metadata as a flexible object. This map is
 * the authoritative TypeScript contract for data-manager operations.
 */
export interface AuthTransactionMetadataByKind {
  authorization: {
    authorization?: {
      primary_method?: 'password' | 'passkey' | 'registration' | 'sso' | 'external_provider';
      primary_credential_version?: number;
      pending_mfa_method?: 'totp' | 'email_otp' | 'sms_otp';
      identifier?: string;
      provider?: 'email' | 'username';
      sso?: {
        connection: string;
        subject?: string;
        claims?: Record<string, unknown>;
      };
      external_provider?: {
        provider: string;
        issuer: string;
        protocol: 'oauth2' | 'oidc' | 'openid2';
        mode: 'sign_in' | 'link';
        state_hash?: string;
        nonce_hash?: string;
        nonce_ciphertext?: string;
        pkce_verifier_ciphertext?: string;
        subject?: string;
        profile?: Record<string, unknown>;
      };
      passkey?: {
        challenge_ciphertext?: string;
      };
    };
  };
  registration: {
    registration?: {
      primary_method?: 'registration';
      identifier?: string;
      provider?: 'email' | 'username';
    };
  };
  organization_invitation: {
    invitation: {
      issued_by: string;
      token_hash: string;
      role: string;
      target_email?: string;
      sso_connection?: string;
    };
  };
  password_recovery: Record<string, never>;
  upsert_password: {
    upsert_password?: {
      reason?: 'invitation' | 'recovery';
    };
  };
}

export type AuthTransactionMetadata<K extends AuthTransactionKind> =
  AuthTransactionMetadataByKind[K];

export const StartAuthTransactionInputSchema = v.object({
  id: PublicIdSchema,
  browserVerifierHash: SecretHashSchema,
  kind: BrowserAuthTransactionKindSchema,
  expiresAt: DateTimeSchema,
  accountId: OptionalRecordIdSchema,
  returnTo: OptionalStringSchema,
});

export const StartIdentityAuthTransactionInputSchema = v.object({
  id: PublicIdSchema,
  browserVerifierHash: SecretHashSchema,
  identifier: v.string('error.auth.identity.invalid'),
  expiresAt: DateTimeSchema,
  returnTo: OptionalStringSchema,
});

/** Parses the identity again at the data boundary to normalize and strip caller input. */
export function parseStartIdentityAuthTransactionInput(input: unknown) {
  const result = v.safeParse(StartIdentityAuthTransactionInputSchema, input);
  if (!result.success) return result;

  const identity = parseAuthenticationIdentity(result.output.identifier);
  if (!identity.success) return identity;

  return {
    success: true as const,
    output: {
      ...result.output,
      ...identity.output,
    },
  };
}

const ExternalProviderSchema = v.picklist(['google', 'github', 'steam']);
const ExternalProviderProtocolSchema = v.picklist(['oauth2', 'oidc', 'openid2']);
const ExternalProviderIssuerSchema = v.pipe(
  v.string('error.input.invalid'),
  v.trim(),
  v.url('error.input.invalid'),
  v.maxLength(2_048, 'error.input.invalid'),
);
const ExternalProviderProfileSchema = v.optional(v.record(v.string(), v.unknown()), {});

export const StartExternalProviderAuthTransactionInputSchema = v.pipe(
  v.object({
    id: PublicIdSchema,
    browserVerifierHash: SecretHashSchema,
    expiresAt: DateTimeSchema,
    accountId: OptionalRecordIdSchema,
    returnTo: OptionalStringSchema,
    provider: ExternalProviderSchema,
    issuer: ExternalProviderIssuerSchema,
    protocol: ExternalProviderProtocolSchema,
    mode: v.picklist(['sign_in', 'link']),
    stateHash: SecretHashSchema,
    nonceHash: v.optional(SecretHashSchema),
    nonceCiphertext: OptionalStringSchema,
    pkceVerifierCiphertext: OptionalStringSchema,
  }),
  v.check(({ mode, accountId }) => mode !== 'link' || Boolean(accountId), 'error.input.invalid'),
);

/** Input produced only after the configured external provider adapter validates its callback. */
const CompleteExternalProviderInputEntries = {
  id: PublicIdSchema,
  browserVerifierHash: SecretHashSchema,
  expectedVersion: v.pipe(
    v.number('error.input.invalid'),
    v.integer('error.input.invalid'),
    v.minValue(0, 'error.input.invalid'),
  ),
  stateHash: SecretHashSchema,
  provider: ExternalProviderSchema,
  issuer: ExternalProviderIssuerSchema,
  subject: FederatedSubjectSchema,
  profile: ExternalProviderProfileSchema,
};

export const CompleteExternalProviderAuthTransactionInputSchema = v.object(
  CompleteExternalProviderInputEntries,
);

/** Input produced after a provider callback is verified for an authenticated account. */
export const CompleteExternalProviderLinkInputSchema = v.object(
  CompleteExternalProviderInputEntries,
);

export const AuthorizeExternalProviderRegistrationInputSchema = v.object({
  id: PublicIdSchema,
  browserVerifierHash: SecretHashSchema,
  expectedVersion: v.pipe(
    v.number('error.input.invalid'),
    v.integer('error.input.invalid'),
    v.minValue(0, 'error.input.invalid'),
  ),
  accountId: RecordIdSchema,
});

export const GetAuthTransactionInputSchema = v.object({
  id: PublicIdSchema,
  browserVerifierHash: SecretHashSchema,
});

export const CompleteAuthTransactionInputSchema = v.object({
  id: PublicIdSchema,
  browserVerifierHash: SecretHashSchema,
  expectedVersion: v.pipe(
    v.number('error.input.invalid'),
    v.integer('error.input.invalid'),
    v.minValue(0, 'error.input.invalid'),
  ),
  accountId: RecordIdSchema,
});

export const ConfirmPasswordAuthTransactionInputSchema = v.object({
  id: PublicIdSchema,
  browserVerifierHash: SecretHashSchema,
  expectedVersion: v.pipe(
    v.number('error.input.invalid'),
    v.integer('error.input.invalid'),
    v.minValue(0, 'error.input.invalid'),
  ),
  accountId: RecordIdSchema,
  password: PasswordSchema,
});

export const ConfirmOtpAuthTransactionInputSchema = v.object({
  id: PublicIdSchema,
  browserVerifierHash: SecretHashSchema,
  expectedVersion: v.pipe(
    v.number('error.input.invalid'),
    v.integer('error.input.invalid'),
    v.minValue(0, 'error.input.invalid'),
  ),
  accountId: RecordIdSchema,
  authenticatorId: RecordIdSchema,
  otpChallengeId: PublicIdSchema,
  codeHash: SecretHashSchema,
});

export const SetPasskeyAuthTransactionChallengeInputSchema = v.object({
  id: PublicIdSchema,
  browserVerifierHash: SecretHashSchema,
  expectedVersion: v.pipe(
    v.number('error.input.invalid'),
    v.integer('error.input.invalid'),
    v.minValue(0, 'error.input.invalid'),
  ),
  accountId: RecordIdSchema,
  challengeCiphertext: v.pipe(
    v.string('error.input.invalid'),
    v.minLength(1, 'error.input.invalid'),
  ),
});

/** Input produced only after verifyPasskeyAuthentication succeeds at the server boundary. */
export const AuthorizePasskeyAuthTransactionInputSchema = v.object({
  id: PublicIdSchema,
  browserVerifierHash: SecretHashSchema,
  expectedVersion: v.pipe(
    v.number('error.input.invalid'),
    v.integer('error.input.invalid'),
    v.minValue(0, 'error.input.invalid'),
  ),
  accountId: RecordIdSchema,
  authenticatorId: RecordIdSchema,
  newCounter: v.pipe(
    v.number('error.input.invalid'),
    v.integer('error.input.invalid'),
    v.minValue(0, 'error.input.invalid'),
  ),
});

/** Input produced only after verifyTotp succeeds at the server boundary. */
export const ConfirmTotpAuthTransactionInputSchema = v.object({
  id: PublicIdSchema,
  browserVerifierHash: SecretHashSchema,
  expectedVersion: v.pipe(
    v.number('error.input.invalid'),
    v.integer('error.input.invalid'),
    v.minValue(0, 'error.input.invalid'),
  ),
  accountId: RecordIdSchema,
  authenticatorId: RecordIdSchema,
});

export const ConfirmRecoveryCodeAuthTransactionInputSchema = v.object({
  id: PublicIdSchema,
  browserVerifierHash: SecretHashSchema,
  expectedVersion: v.pipe(
    v.number('error.input.invalid'),
    v.integer('error.input.invalid'),
    v.minValue(0, 'error.input.invalid'),
  ),
  accountId: RecordIdSchema,
  codeHash: SecretHashSchema,
});

export const CreateOrganizationInvitationTransactionInputSchema = v.object({
  id: PublicIdSchema,
  organizationId: RecordIdSchema,
  issuedByAccountId: RecordIdSchema,
  tokenHash: SecretHashSchema,
  expiresAt: DateTimeSchema,
  role: v.pipe(v.string('error.input.invalid'), v.trim(), v.minLength(1, 'error.input.invalid')),
  targetEmail: v.optional(
    v.nullable(
      v.pipe(
        v.string('error.input.invalid'),
        v.trim(),
        v.toLowerCase(),
        v.email('error.fields.email.malformed'),
      ),
    ),
  ),
  ssoConnectionId: OptionalRecordIdSchema,
});

export const GetRedeemableOrganizationInvitationInputSchema = v.object({
  id: PublicIdSchema,
  tokenHash: SecretHashSchema,
});

export const RedeemOrganizationInvitationInputSchema = v.object({
  id: PublicIdSchema,
  tokenHash: SecretHashSchema,
  childId: PublicIdSchema,
  browserVerifierHash: SecretHashSchema,
  expiresAt: DateTimeSchema,
  returnTo: OptionalStringSchema,
});

export const CompleteOrganizationInvitationInputSchema = v.object({
  id: PublicIdSchema,
  browserVerifierHash: SecretHashSchema,
  expectedVersion: v.pipe(
    v.number('error.input.invalid'),
    v.integer('error.input.invalid'),
    v.minValue(0, 'error.input.invalid'),
  ),
  accountId: RecordIdSchema,
  membershipId: PublicIdSchema,
});

export const AuthorizeRegistrationAuthTransactionInputSchema = v.object({
  id: PublicIdSchema,
  browserVerifierHash: SecretHashSchema,
  expectedVersion: v.pipe(
    v.number('error.input.invalid'),
    v.integer('error.input.invalid'),
    v.minValue(0, 'error.input.invalid'),
  ),
  accountId: RecordIdSchema,
});

export const AuthorizeOrganizationInvitationSsoInputSchema = v.object({
  id: PublicIdSchema,
  browserVerifierHash: SecretHashSchema,
  expectedVersion: v.pipe(
    v.number('error.input.invalid'),
    v.integer('error.input.invalid'),
    v.minValue(0, 'error.input.invalid'),
  ),
  accountId: RecordIdSchema,
  federatedSubject: FederatedSubjectSchema,
  federatedMetadata: FederatedMetadataSchema,
});

export const RevokeOrganizationInvitationTransactionInputSchema = v.object({
  id: PublicIdSchema,
  issuedByAccountId: RecordIdSchema,
  expectedVersion: v.pipe(
    v.number('error.input.invalid'),
    v.integer('error.input.invalid'),
    v.minValue(0, 'error.input.invalid'),
  ),
});

export const RevokeOrganizationAccessInputSchema = v.object({
  accountId: RecordIdSchema,
  organizationId: RecordIdSchema,
  reason: v.pipe(v.string('error.input.invalid'), v.trim(), v.minLength(1, 'error.input.invalid')),
});

export const EnforceOrganizationSsoInputSchema = v.object({
  organizationId: RecordIdSchema,
  connectionId: RecordIdSchema,
  enforcedByAccountId: RecordIdSchema,
});

/** Input produced only after an OIDC or SAML assertion has been verified at the server boundary. */
export const VerifyOrganizationMembershipSsoInputSchema = v.object({
  accountId: RecordIdSchema,
  organizationId: RecordIdSchema,
  connectionId: RecordIdSchema,
  federatedSubject: FederatedSubjectSchema,
  federatedMetadata: FederatedMetadataSchema,
});

export const RevokeMembershipFromWebhookInputSchema = v.object({
  connectionId: RecordIdSchema,
  issuer: v.pipe(v.string('error.input.invalid'), v.trim(), v.url('error.input.invalid')),
  subject: FederatedSubjectSchema,
  reason: v.pipe(v.string('error.input.invalid'), v.trim(), v.minLength(1, 'error.input.invalid')),
});

export const CreateOtpChallengeInputSchema = v.pipe(
  v.object({
    id: PublicIdSchema,
    purpose: v.picklist(['verify_identity', 'mfa', 'recovery']),
    codeHash: SecretHashSchema,
    expiresAt: DateTimeSchema,
    accountId: OptionalRecordIdSchema,
    identityId: OptionalRecordIdSchema,
    authenticatorId: OptionalRecordIdSchema,
    transactionId: OptionalRecordIdSchema,
    maxAttempts: v.optional(
      v.pipe(
        v.number('error.input.invalid'),
        v.integer('error.input.invalid'),
        v.minValue(1, 'error.input.invalid'),
        v.maxValue(10, 'error.input.invalid'),
      ),
      5,
    ),
  }),
  v.check(
    ({ purpose, accountId, identityId, authenticatorId, transactionId }) =>
      Boolean(accountId || identityId || authenticatorId || transactionId) &&
      (purpose !== 'mfa' || Boolean(accountId && authenticatorId)),
    'error.input.invalid',
  ),
);

export const ConsumeOtpChallengeInputSchema = v.object({
  id: PublicIdSchema,
  codeHash: SecretHashSchema,
});

export const PurgeExpiredAuthTransactionsInputSchema = v.object({
  limit: v.optional(
    v.pipe(
      v.number('error.input.invalid'),
      v.integer('error.input.invalid'),
      v.minValue(1, 'error.input.invalid'),
      v.maxValue(1_000, 'error.input.invalid'),
    ),
    250,
  ),
});

export const CreateMfaAuthenticatorInputSchema = v.pipe(
  v.object({
    id: PublicIdSchema,
    accountId: RecordIdSchema,
    identityId: OptionalRecordIdSchema,
    kind: v.picklist(['totp', 'email_otp', 'sms_otp']),
    secretCiphertext: OptionalStringSchema,
    label: OptionalStringSchema,
  }),
  v.check(
    ({ kind, identityId, secretCiphertext }) =>
      (kind === 'totp' && Boolean(secretCiphertext)) ||
      ((kind === 'email_otp' || kind === 'sms_otp') && Boolean(identityId)),
    'error.input.invalid',
  ),
);

export const ActivateMfaAuthenticatorInputSchema = v.object({
  id: PublicIdSchema,
  accountId: RecordIdSchema,
  otpChallengeId: PublicIdSchema,
  codeHash: SecretHashSchema,
});

export const ReplaceRecoveryCodeAuthenticatorsInputSchema = v.object({
  accountId: RecordIdSchema,
  codes: v.pipe(
    v.array(
      v.object({
        id: PublicIdSchema,
        secretHash: SecretHashSchema,
      }),
    ),
    v.minLength(1, 'error.input.invalid'),
    v.maxLength(32, 'error.input.invalid'),
  ),
});

export const ConsumeRecoveryCodeAuthenticatorInputSchema = v.object({
  accountId: RecordIdSchema,
  codeHash: SecretHashSchema,
});

/** Input produced only after verifyPasskeyRegistration succeeds at the server boundary. */
export const PersistVerifiedPasskeyAuthenticatorInputSchema = v.object({
  id: PublicIdSchema,
  accountId: RecordIdSchema,
  credentialId: v.pipe(
    v.string('error.input.invalid'),
    v.regex(/^[A-Za-z0-9_-]+$/, 'error.input.invalid'),
  ),
  webauthnUserId: v.pipe(
    v.string('error.input.invalid'),
    v.regex(/^[A-Za-z0-9_-]+$/, 'error.input.invalid'),
  ),
  publicKey: v.pipe(
    v.string('error.input.invalid'),
    v.regex(/^[A-Za-z0-9_-]+$/, 'error.input.invalid'),
  ),
  counter: v.pipe(
    v.number('error.input.invalid'),
    v.integer('error.input.invalid'),
    v.minValue(0, 'error.input.invalid'),
  ),
  transports: v.optional(v.array(v.string('error.input.invalid')), []),
  deviceType: v.picklist(['singleDevice', 'multiDevice']),
  backedUp: v.boolean('error.input.invalid'),
  label: OptionalStringSchema,
});

export const TouchPasskeyAuthenticatorInputSchema = v.object({
  id: PublicIdSchema,
  counter: v.pipe(
    v.number('error.input.invalid'),
    v.integer('error.input.invalid'),
    v.minValue(0, 'error.input.invalid'),
  ),
});

export const StartPasswordRecoveryTransactionInputSchema = v.object({
  id: PublicIdSchema,
  browserVerifierHash: SecretHashSchema,
  identifier: v.pipe(
    v.string('error.input.invalid'),
    v.trim(),
    v.minLength(1, 'error.auth.identity.required'),
  ),
  expiresAt: DateTimeSchema,
});
export type StartPasswordRecoveryTransactionInput = v.InferOutput<
  typeof StartPasswordRecoveryTransactionInputSchema
>;

export const CompleteUpsertPasswordTransactionInputSchema = v.object({
  id: PublicIdSchema,
  browserVerifierHash: SecretHashSchema,
  expectedVersion: v.pipe(v.number(), v.integer(), v.minValue(0)),
  accountId: RecordIdSchema,
  password: PasswordSchema,
});
export type CompleteUpsertPasswordTransactionInput = v.InferOutput<
  typeof CompleteUpsertPasswordTransactionInputSchema
>;

export const GetAccountProfileInputSchema = v.object({
  accountId: RecordIdSchema,
});
export type GetAccountProfileInput = v.InferOutput<typeof GetAccountProfileInputSchema>;

export const UpdateAccountProfileInputSchema = v.object({
  accountId: RecordIdSchema,
  displayName: v.pipe(
    v.string('error.input.invalid'),
    v.trim(),
    v.minLength(2, 'error.fields.full_name.too_short'),
    v.maxLength(100, 'error.fields.full_name.too_long'),
  ),
});
export type UpdateAccountProfileInput = v.InferOutput<typeof UpdateAccountProfileInputSchema>;

export const RemoveAccountAuthenticatorInputSchema = v.object({
  accountId: RecordIdSchema,
  authenticatorId: RecordIdSchema,
});
export type RemoveAccountAuthenticatorInput = v.InferOutput<
  typeof RemoveAccountAuthenticatorInputSchema
>;

export const DisableAccountMfaInputSchema = v.object({
  accountId: RecordIdSchema,
});
export type DisableAccountMfaInput = v.InferOutput<typeof DisableAccountMfaInputSchema>;

export const ActivateDirectTotpAuthenticatorInputSchema = v.object({
  accountId: RecordIdSchema,
  authenticatorId: PublicIdSchema,
  secretCiphertext: v.pipe(v.string('error.input.invalid'), v.trim(), v.minLength(1)),
  codes: v.array(
    v.object({
      id: PublicIdSchema,
      secretHash: SecretHashSchema,
    }),
  ),
});
export type ActivateDirectTotpAuthenticatorInput = v.InferOutput<
  typeof ActivateDirectTotpAuthenticatorInputSchema
>;
