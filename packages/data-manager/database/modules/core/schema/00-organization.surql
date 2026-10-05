DEFINE TABLE organization SCHEMAFULL;
DEFINE FIELD type ON organization TYPE string ASSERT $value IN ['personal', 'business'];
DEFINE FIELD name ON organization TYPE string;
DEFINE FIELD slug ON organization TYPE string;
DEFINE FIELD createdAt ON organization TYPE datetime DEFAULT time::now() READONLY;
DEFINE FIELD updatedAt ON organization TYPE datetime VALUE time::now();
DEFINE INDEX idx_organization_slug ON organization COLUMNS slug UNIQUE;
