export const auth = {
  title: {
    application: 'Galfus Identity',
    sign_in: 'Entrar no Galfus',
    create_account: 'Crie sua conta',
    welcome_back: 'Que bom ter você de volta',
    two_step_verification: 'Verificação em duas etapas',
    identity_failed: 'Falha na identificação',
    registration_failed: 'Falha no registro',
    sign_in_failed: 'Falha ao entrar',
  },
  description: {
    sign_in: 'Informe seus dados para continuar.',
    two_step_verification: 'Informe o código de 6 dígitos do seu aplicativo autenticador.',
  },
  label: {
    identity: 'E-mail ou nome de usuário',
    full_name: 'Nome completo',
    password: 'Senha',
    create_password: 'Crie uma senha',
    confirm_password: 'Confirme a senha',
  },
  placeholder: {
    identity: 'usuario@galfus.com',
    full_name: 'ex.: João da Silva',
  },
  action: {
    sign_in: 'Entrar',
    sign_up: 'Criar conta',
    sign_in_with_passkey: 'Entrar com chave de acesso',
    forgot_password: 'Esqueceu a senha?',
    use_different_identity: 'Usar outra identidade',
    use_different_email: 'Usar outro e-mail',
    try_another_way: 'Tentar outra forma',
    verify: 'Verificar',
  },
  connective: {
    or_use_password: 'ou use a senha',
    or_continue_with: 'ou continue com',
  },
} as const;
