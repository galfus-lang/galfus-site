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
    },
    identity: {
      invalid: 'Enter a valid email address or username.',
      already_exists: 'This email address or username is already in use.',
    },
    pass: {
      too_short: 'The password must be at least 8 characters long.',
      too_long: 'The password must be at most 128 characters long.',
      password_dont_match: 'The passwords do not match.',
    },
  },
} as const;
