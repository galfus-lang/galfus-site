DEFINE TABLE organization SCHEMAFULL COMMENT 'Personal or business workspace that owns projects, memberships, invitations, and SSO connections.';
DEFINE FIELD type ON organization TYPE string ASSERT $value IN ['personal', 'business'];
DEFINE FIELD name ON organization TYPE string;
DEFINE FIELD slug ON organization TYPE string;
DEFINE FIELD created_at ON organization TYPE datetime DEFAULT time::now() READONLY;
DEFINE FIELD updated_at ON organization TYPE datetime VALUE time::now();
DEFINE INDEX idx_organization_slug ON organization COLUMNS slug UNIQUE;
