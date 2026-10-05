export const auth = {
  title: {
    application: 'Galfus Identity',
    sign_in: 'Sign in to Galfus',
    create_account: 'Create your account',
    welcome_back: 'Welcome back',
    two_step_verification: 'Two-step verification',
    identity_failed: 'Identification failed',
    registration_failed: 'Registration failed',
    sign_in_failed: 'Sign-in failed',
  },
  description: {
    sign_in: 'Enter your details to continue.',
    two_step_verification: 'Enter the 6-digit code from your authenticator app.',
  },
  label: {
    identity: 'Email or username',
    full_name: 'Full name',
    password: 'Password',
    create_password: 'Create a password',
    confirm_password: 'Confirm password',
  },
  placeholder: {
    identity: 'user@galfus.com',
    full_name: 'e.g. John Doe',
  },
  action: {
    sign_in: 'Sign in',
    sign_up: 'Sign up',
    sign_in_with_passkey: 'Sign in with passkey',
    forgot_password: 'Forgot password?',
    use_different_identity: 'Use a different identity',
    use_different_email: 'Use a different email',
    try_another_way: 'Try another way',
    verify: 'Verify',
  },
  connective: {
    or_use_password: 'or use password',
    or_continue_with: 'or continue with',
  },
} as const;
