-- --------------------------------------------------
-- 1. IDENTITY & AUTHENTICATION
-- --------------------------------------------------

-- ACCOUNT (The root user account)
DEFINE TABLE account SCHEMAFULL;
DEFINE FIELD name ON account TYPE string;
DEFINE FIELD displayName ON account TYPE string;
DEFINE FIELD createdAt ON account TYPE datetime DEFAULT time::now() READONLY;
DEFINE FIELD updatedAt ON account TYPE datetime VALUE time::now();

-- ACCOUNT_IDENTITY (Ways to identify and log in)
DEFINE TABLE account_identity SCHEMAFULL;
-- provider can be 'email', 'username', 'google', 'github', 'cpf', etc.
DEFINE FIELD provider ON account_identity TYPE string;
DEFINE FIELD identifier ON account_identity TYPE string;
-- Direct relationship (Foreign Key) to the account
DEFINE FIELD account ON account_identity TYPE record<account>;
-- Nested object to store provider metadata (e.g., OAuth tokens, extra data)
DEFINE FIELD metadata ON account_identity TYPE object DEFAULT {};
DEFINE FIELD createdAt ON account_identity TYPE datetime DEFAULT time::now() READONLY;

-- Ensure that there are no duplicate identities for the same provider (e.g., 2 identical emails)
DEFINE INDEX idx_provider_identifier ON account_identity COLUMNS provider, identifier UNIQUE;

-- ACCOUNT_KEY (Keys, passwords, and account validations)
DEFINE TABLE account_key SCHEMAFULL;
-- type can be 'password', 'mfa_totp', 'passkey', 'recovery_code'
DEFINE FIELD type ON account_key TYPE string;
DEFINE FIELD value ON account_key TYPE string; -- The password hash or secret
DEFINE FIELD account ON account_key TYPE record<account>;
DEFINE FIELD expiresAt ON account_key TYPE option<datetime>;
DEFINE FIELD createdAt ON account_key TYPE datetime DEFAULT time::now() READONLY;

-- --------------------------------------------------
-- 2. CORE & ORGANIZATIONS
-- --------------------------------------------------

-- ORGANIZATION (Central grouping entity)
DEFINE TABLE organization SCHEMAFULL;
-- type can be 'personal' or 'business'
DEFINE FIELD type ON organization TYPE string;
DEFINE FIELD name ON organization TYPE string;
DEFINE FIELD slug ON organization TYPE string;
DEFINE FIELD createdAt ON organization TYPE datetime DEFAULT time::now() READONLY;
DEFINE FIELD updatedAt ON organization TYPE datetime VALUE time::now();

-- The organization slug must be globally unique (e.g., github.com/NAME)
DEFINE INDEX idx_organization_slug ON organization COLUMNS slug UNIQUE;

-- BELONGS_TO (GRAPH Relation: Account -> Organization)
-- This allows advanced graph queries: SELECT ->belongs_to->organization FROM account:1
DEFINE TABLE belongs_to SCHEMAFULL TYPE RELATION IN account OUT organization;
-- role can be 'owner', 'admin', 'member'
DEFINE FIELD role ON belongs_to TYPE string DEFAULT 'member';
DEFINE FIELD joinedAt ON belongs_to TYPE datetime DEFAULT time::now() READONLY;

-- PROJECT (Repository/Game/Project within an Org)
DEFINE TABLE project SCHEMAFULL;
DEFINE FIELD name ON project TYPE string;
DEFINE FIELD slug ON project TYPE string;
-- Direct relationship (Foreign Key) to the organization (1 Org -> N Projects)
DEFINE FIELD organization ON project TYPE record<organization>;
-- Dynamic settings and metadata (Nested JSON)
DEFINE FIELD config ON project TYPE object DEFAULT {};
DEFINE FIELD createdAt ON project TYPE datetime DEFAULT time::now() READONLY;
DEFINE FIELD updatedAt ON project TYPE datetime VALUE time::now();

-- The project slug must be unique WITHIN the organization
DEFINE INDEX idx_project_org_slug ON project COLUMNS organization, slug UNIQUE;
