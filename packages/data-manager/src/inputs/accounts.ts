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
