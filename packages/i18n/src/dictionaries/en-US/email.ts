export const email = {
  recovery: {
    subject: 'Reset your Galfus password',
    preview: 'Use this link to reset your password.',
    title: 'Reset your password',
    introduction: 'We received a request to reset your Galfus password.',
    action: 'Reset password',
    expiration: 'This link expires in {minutes, plural, one {# minute} other {# minutes}}.',
    disclaimer: 'If you did not request this, you can ignore this email.',
  },
  verification: {
    subject: 'Verify your email address',
    preview: 'Use this code to verify your email address.',
    title: 'Verify your email address',
    introduction: 'Enter this code to verify that this email address belongs to you:',
    expiration: 'This code expires in {minutes, plural, one {# minute} other {# minutes}}.',
    disclaimer: 'If you did not request this code, you can ignore this email.',
  },
} as const;
