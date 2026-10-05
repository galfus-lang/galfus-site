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
    pass: {
      required: 'Enter your password.',
      too_short: 'The password must be at least 8 characters long.',
      too_long: 'The password must be at most 128 characters long.',
      password_dont_match: 'The passwords do not match.',
      incorrect: 'The password is incorrect. Please try again.',
    },
    registration: {
      session_missing: 'The registration session is missing.',
      session_invalid: 'The registration session is invalid.',
      failed: 'We could not create your account. Please try again.',
    },
    login: {
      session_invalid: 'The sign-in session is invalid.',
      failed: 'Something went wrong. Please try again.',
    },
  },
} as const;
