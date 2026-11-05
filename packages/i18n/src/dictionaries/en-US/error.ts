export const error = {
  input: {
    invalid: 'The submitted data is invalid.',
  },
  fields: {
    email: {
      required: 'Enter your email address.',
      malformed: 'Enter a valid email address.',
      too_long: 'The email address is too long.',
    },
    username: {
      required: 'Enter your username.',
      too_short: 'The username must be at least 3 characters long.',
      too_long: 'The username must be at most 32 characters long.',
      malformed: 'Use only letters, numbers, hyphens, and underscores in the username.',
    },
    full_name: {
      required: 'Enter your full name.',
      too_short: 'The full name must be at least 2 characters long.',
      too_long: 'The full name must be at most 100 characters long.',
    },
  },
  auth: {
    account: {
      invalid: 'The account is invalid.',
      blocked: 'This account is temporarily blocked. Contact support.',
    },
    identity: {
      invalid: 'Enter a valid email address or username.',
      already_exists: 'This email address or username is already in use.',
      lookup_failed: 'We could not verify this identity. Please try again.',
    },
    sso_identity: {
      already_linked: 'This corporate identity is already linked to another organization member.',
    },
    pass: {
      required: 'Enter your password.',
      too_short: 'The password must be at least 8 characters long.',
      too_long: 'The password must be at most 128 characters long.',
      password_dont_match: 'The passwords do not match.',
      incorrect: 'The password is incorrect. Please try again.',
    },
    registration: {
      email_required: 'Enter an email address to create an account.',
      delivery_failed: 'We could not send the verification code. Please try again.',
      resend_limited: 'Wait at least one minute before requesting another code.',
      transaction_missing: 'The registration transaction is missing.',
      transaction_invalid: 'The registration transaction is invalid.',
      failed: 'We could not create your account. Please try again.',
    },
    login: {
      transaction_invalid: 'The sign-in transaction is invalid.',
      failed: 'Something went wrong. Please try again.',
    },
    transaction: {
      invalid: 'This authorization request is no longer valid. Please start again.',
      expired: 'This authorization request has expired. Please start again.',
      state_conflict: 'This authorization request changed in another tab. Please start again.',
    },
    invitation: {
      invalid: 'This invitation is no longer valid.',
      already_used: 'This invitation has already been used.',
      expired: 'This invitation has expired.',
      revoked: 'This invitation has been revoked.',
      sso_required: 'Corporate sign-in is required to accept this invitation.',
    },
    access: {
      invalid: 'Your access credential is no longer valid. Please sign in again.',
    },
    otp: {
      invalid: 'The verification code is invalid or expired.',
      incorrect: 'The code is incorrect. Please try again.',
    },
  },
} as const;
