DEFINE TABLE project SCHEMAFULL;
DEFINE FIELD name ON project TYPE string;
DEFINE FIELD slug ON project TYPE string;
DEFINE FIELD organization ON project TYPE record<organization>;
DEFINE FIELD config ON project TYPE object DEFAULT {};
DEFINE FIELD createdAt ON project TYPE datetime DEFAULT time::now() READONLY;
DEFINE FIELD updatedAt ON project TYPE datetime VALUE time::now();
DEFINE INDEX idx_project_org_slug ON project COLUMNS organization, slug UNIQUE;
