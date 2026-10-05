DEFINE TABLE account_key SCHEMAFULL;
DEFINE FIELD type ON account_key TYPE string ASSERT $value IN ['password', 'mfa_totp', 'passkey', 'recovery_code'];
DEFINE FIELD value ON account_key TYPE string;
DEFINE FIELD account ON account_key TYPE record<account>;
DEFINE FIELD expiresAt ON account_key TYPE option<datetime>;
DEFINE FIELD createdAt ON account_key TYPE datetime DEFAULT time::now() READONLY;
