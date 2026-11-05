export const error = {
  input: {
    invalid: 'Os dados enviados são inválidos.',
  },
  fields: {
    email: {
      required: 'Informe seu endereço de e-mail.',
      malformed: 'Informe um endereço de e-mail válido.',
      too_long: 'O endereço de e-mail é muito longo.',
    },
    username: {
      required: 'Informe seu nome de usuário.',
      too_short: 'O nome de usuário deve ter pelo menos 3 caracteres.',
      too_long: 'O nome de usuário deve ter no máximo 32 caracteres.',
      malformed: 'Use apenas letras, números, hífens e underscores no nome de usuário.',
    },
    full_name: {
      required: 'Informe seu nome completo.',
      too_short: 'O nome completo deve ter pelo menos 2 caracteres.',
      too_long: 'O nome completo deve ter no máximo 100 caracteres.',
    },
  },
  auth: {
    account: {
      invalid: 'A conta informada é inválida.',
      blocked: 'Esta conta está temporariamente bloqueada. Contate o suporte.',
    },
    identity: {
      invalid: 'Informe um endereço de e-mail ou nome de usuário válido.',
      already_exists: 'Este e-mail ou nome de usuário já está em uso.',
      lookup_failed: 'Não foi possível verificar esta identidade. Tente novamente.',
    },
    sso_identity: {
      already_linked:
        'Esta identidade corporativa já está vinculada a outro membro da organização.',
    },
    pass: {
      required: 'Informe sua senha.',
      too_short: 'A senha deve ter no mínimo 8 caracteres.',
      too_long: 'A senha deve ter no máximo 128 caracteres.',
      password_dont_match: 'As senhas não coincidem.',
      incorrect: 'A senha está incorreta. Tente novamente.',
    },
    registration: {
      email_required: 'Informe um e-mail para criar uma conta.',
      delivery_failed: 'Não foi possível enviar o código de verificação. Tente novamente.',
      resend_limited: 'Aguarde pelo menos um minuto antes de solicitar outro código.',
      transaction_missing: 'A transação de registro está ausente.',
      transaction_invalid: 'A transação de registro é inválida.',
      failed: 'Não foi possível criar sua conta. Tente novamente.',
    },
    login: {
      transaction_invalid: 'A transação de entrada é inválida.',
      failed: 'Ocorreu um erro. Tente novamente.',
    },
    transaction: {
      invalid: 'Esta solicitação de autorização não é mais válida. Comece novamente.',
      expired: 'Esta solicitação de autorização expirou. Comece novamente.',
      state_conflict: 'Esta solicitação foi alterada em outra aba. Comece novamente.',
    },
    invitation: {
      invalid: 'Este convite não é mais válido.',
      already_used: 'Este convite já foi utilizado.',
      expired: 'Este convite expirou.',
      revoked: 'Este convite foi revogado.',
      sso_required: 'A entrada corporativa é necessária para aceitar este convite.',
    },
    access: {
      invalid: 'Sua credencial de acesso não é mais válida. Entre novamente.',
    },
    otp: {
      invalid: 'O código de verificação é inválido ou expirou.',
      incorrect: 'O código está incorreto. Tente novamente.',
    },
  },
} as const;
