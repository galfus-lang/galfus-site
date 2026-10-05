DEFINE TABLE account SCHEMAFULL;
DEFINE FIELD name ON account TYPE string;
DEFINE FIELD displayName ON account TYPE string;
DEFINE FIELD status ON account TYPE string DEFAULT 'active' ASSERT $value IN ['active', 'suspended', 'disabled'];
DEFINE FIELD mfaEnabled ON account TYPE bool DEFAULT false;
DEFINE FIELD createdAt ON account TYPE datetime DEFAULT time::now() READONLY;
DEFINE FIELD updatedAt ON account TYPE datetime VALUE time::now();
