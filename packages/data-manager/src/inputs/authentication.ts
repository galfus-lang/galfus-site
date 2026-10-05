import * as v from 'valibot';

export const IdentityProviderSchema = v.picklist(['email', 'username']);
export type IdentityProvider = v.InferOutput<typeof IdentityProviderSchema>;

export const EmailIdentifierSchema = v.pipe(
  v.string('error.fields.email.required'),
  v.trim(),
  v.toLowerCase(),
  v.minLength(1, 'error.fields.email.required'),
  v.email('error.fields.email.malformed'),
  v.maxLength(254, 'error.fields.email.too_long'),
);

export const UsernameIdentifierSchema = v.pipe(
  v.string('error.fields.username.required'),
  v.trim(),
  v.minLength(3, 'error.fields.username.too_short'),
  v.maxLength(32, 'error.fields.username.too_long'),
  v.regex(
    /^[a-zA-Z0-9][a-zA-Z0-9_-]*$/,
    'error.fields.username.malformed',
  ),
);

/**
 * Normalizes and validates the identity accepted by the current sign-in flow.
 * An input containing "@" is always treated as an e-mail, so malformed e-mails
 * cannot fall back to usernames.
 */
export function parseAuthenticationIdentity(
  input: unknown,
):
  | { success: true; output: { provider: IdentityProvider; identifier: string } }
  | { success: false; issues: v.BaseIssue<unknown>[] } {
  const provider: IdentityProvider =
    typeof input === 'string' && input.includes('@') ? 'email' : 'username';
  const result = v.safeParse(
    provider === 'email' ? EmailIdentifierSchema : UsernameIdentifierSchema,
    input,
  );

  if (!result.success) {
    return { success: false, issues: result.issues };
  }

  return {
    success: true,
    output: { provider, identifier: result.output },
  };
}

export const RegistrationCredentialsSchema = v.pipe(
  v.object({
    fullName: v.pipe(
      v.string('error.fields.full_name.required'),
      v.trim(),
      v.minLength(2, 'error.fields.full_name.too_short'),
      v.maxLength(100, 'error.fields.full_name.too_long'),
    ),
    password: v.pipe(
      v.string('error.auth.pass.too_short'),
      v.minLength(8, 'error.auth.pass.too_short'),
      v.maxLength(128, 'error.auth.pass.too_long'),
    ),
    confirmPassword: v.string('error.auth.pass.password_dont_match'),
  }),
  v.forward(
    v.check(
      ({ password, confirmPassword }) => password === confirmPassword,
      'error.auth.pass.password_dont_match',
    ),
    ['confirmPassword'],
  ),
);
export type RegistrationCredentials = v.InferOutput<typeof RegistrationCredentialsSchema>;

export function parseRegistrationCredentials(input: unknown) {
  return v.safeParse(RegistrationCredentialsSchema, input);
}
