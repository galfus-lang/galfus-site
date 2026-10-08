DEFINE TABLE account SCHEMAFULL COMMENT 'Global person or service account that owns authentication methods.';
DEFINE FIELD display_name ON account TYPE string;
DEFINE FIELD status ON account TYPE string DEFAULT 'active' ASSERT $value IN ['active', 'suspended', 'disabled'];
DEFINE FIELD credential_version ON account TYPE int DEFAULT 0;
DEFINE FIELD created_at ON account TYPE datetime DEFAULT time::now() READONLY;
DEFINE FIELD updated_at ON account TYPE datetime VALUE time::now();
