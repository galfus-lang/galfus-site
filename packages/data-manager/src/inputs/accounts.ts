import * as v from 'valibot';

import { parseAuthenticationIdentity } from './authentication';

const AccountIdInputSchema = v.pipe(
  v.string('error.auth.account.invalid'),
  v.trim(),
  v.minLength(1, 'error.auth.account.invalid'),
);

const PasswordInputSchema = v.pipe(
  v.string('error.auth.pass.too_short'),
  v.minLength(8, 'error.auth.pass.too_short'),
  v.maxLength(128, 'error.auth.pass.too_long'),
);

const FullNameInputSchema = v.pipe(
  v.string('error.fields.full_name.required'),
  v.trim(),
  v.minLength(2, 'error.fields.full_name.too_short'),
  v.maxLength(100, 'error.fields.full_name.too_long'),
);

export const ExternalIdentityProviderSchema = v.picklist(['google', 'github', 'steam']);
export type ExternalIdentityProvider = v.InferOutput<typeof ExternalIdentityProviderSchema>;

const ExternalIdentityIssuerSchema = v.pipe(
  v.string('error.input.invalid'),
  v.trim(),
  v.url('error.input.invalid'),
  v.maxLength(2_048, 'error.input.invalid'),
);

const ExternalIdentitySubjectSchema = v.pipe(
  v.string('error.input.invalid'),
  v.trim(),
  v.minLength(1, 'error.input.invalid'),
  v.maxLength(512, 'error.input.invalid'),
);

const ExternalIdentityMetadataSchema = v.optional(v.record(v.string(), v.unknown()), {});

export const FindAccountByIdentityInputSchema = v.object({
  identifier: v.string('error.auth.identity.invalid'),
});

export const CreatePasswordAccountInputSchema = v.object({
  identifier: v.string('error.auth.identity.invalid'),
  fullName: FullNameInputSchema,
  password: PasswordInputSchema,
});

export const VerifyAccountPasswordInputSchema = v.object({
  accountId: AccountIdInputSchema,
  password: PasswordInputSchema,
});

export const GetAccountAuthenticationStateInputSchema = v.object({
  accountId: AccountIdInputSchema,
});

export const FindAccountByExternalIdentityInputSchema = v.object({
  provider: ExternalIdentityProviderSchema,
  issuer: ExternalIdentityIssuerSchema,
  subject: ExternalIdentitySubjectSchema,
});

export const CreateExternalAccountInputSchema = v.object({
  provider: ExternalIdentityProviderSchema,
  issuer: ExternalIdentityIssuerSchema,
  subject: ExternalIdentitySubjectSchema,
  metadata: ExternalIdentityMetadataSchema,
  fullName: FullNameInputSchema,
});

export const LinkExternalIdentityInputSchema = v.object({
  accountId: AccountIdInputSchema,
  provider: ExternalIdentityProviderSchema,
  issuer: ExternalIdentityIssuerSchema,
  subject: ExternalIdentitySubjectSchema,
  metadata: ExternalIdentityMetadataSchema,
});

export const UnlinkExternalIdentityInputSchema = v.object({
  accountId: AccountIdInputSchema,
  provider: ExternalIdentityProviderSchema,
  issuer: ExternalIdentityIssuerSchema,
  subject: ExternalIdentitySubjectSchema,
});

export const IncrementAccountCredentialVersionInputSchema = v.object({
  accountId: AccountIdInputSchema,
});

export const UpsertAccountPasswordInputSchema = v.object({
  accountId: AccountIdInputSchema,
  password: PasswordInputSchema,
});

export function parseFindAccountByIdentityInput(input: unknown) {
  const result = v.safeParse(FindAccountByIdentityInputSchema, input);
  if (!result.success) return result;

  return parseAuthenticationIdentity(result.output.identifier);
}

export function parseCreatePasswordAccountInput(input: unknown) {
  const result = v.safeParse(CreatePasswordAccountInputSchema, input);
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
