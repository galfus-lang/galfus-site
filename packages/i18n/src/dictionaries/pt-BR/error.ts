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
    },
    identity: {
      invalid: 'Informe um endereço de e-mail ou nome de usuário válido.',
      already_exists: 'Este e-mail ou nome de usuário já está em uso.',
    },
    pass: {
      too_short: 'A senha deve ter no mínimo 8 caracteres.',
      too_long: 'A senha deve ter no máximo 128 caracteres.',
      password_dont_match: 'As senhas não coincidem.',
    },
  },
} as const;
