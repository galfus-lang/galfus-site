DEFINE TABLE account_identity SCHEMAFULL;
DEFINE FIELD provider ON account_identity TYPE string ASSERT $value IN ['email', 'username'];
DEFINE FIELD identifier ON account_identity TYPE string;
DEFINE FIELD account ON account_identity TYPE record<account>;
DEFINE FIELD metadata ON account_identity TYPE object DEFAULT {};
DEFINE FIELD createdAt ON account_identity TYPE datetime DEFAULT time::now() READONLY;
DEFINE INDEX idx_provider_identifier ON account_identity COLUMNS provider, identifier UNIQUE;
