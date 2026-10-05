DEFINE TABLE account_key SCHEMAFULL;
-- Password credentials remain here while second factors and passkeys have
-- dedicated records with their own lifecycle and metadata.
DEFINE FIELD type ON account_key TYPE string ASSERT $value = 'password';
DEFINE FIELD value ON account_key TYPE string;
DEFINE FIELD account ON account_key TYPE record<account>;
DEFINE FIELD expiresAt ON account_key TYPE option<datetime>;
DEFINE FIELD createdAt ON account_key TYPE datetime DEFAULT time::now() READONLY;
