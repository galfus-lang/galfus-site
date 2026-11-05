export const email = {
  recovery: {
    subject: 'Redefina sua senha Galfus',
    preview: 'Use este link para redefinir sua senha.',
    title: 'Redefina sua senha',
    introduction: 'Recebemos uma solicitação para redefinir sua senha Galfus.',
    action: 'Redefinir senha',
    expiration: 'Este link expira em {minutes, plural, one {# minuto} other {# minutos}}.',
    disclaimer: 'Se você não fez esta solicitação, pode ignorar este e-mail.',
  },
  verification: {
    subject: 'Confirme seu endereço de e-mail',
    preview: 'Use este código para confirmar seu endereço de e-mail.',
    title: 'Confirme seu endereço de e-mail',
    introduction: 'Digite este código para confirmar que o endereço de e-mail é seu:',
    expiration: 'Este código expira em {minutes, plural, one {# minuto} other {# minutos}}.',
    disclaimer: 'Se você não solicitou este código, pode ignorar este e-mail.',
  },
} as const;
