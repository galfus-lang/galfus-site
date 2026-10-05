DEFINE TABLE account_federated_identity SCHEMAFULL;
DEFINE FIELD account ON account_federated_identity TYPE record<account>;
DEFINE FIELD connection ON account_federated_identity TYPE record<organization_sso_connection>;
DEFINE FIELD issuer ON account_federated_identity TYPE string;
DEFINE FIELD subject ON account_federated_identity TYPE string;
DEFINE FIELD metadata ON account_federated_identity TYPE object DEFAULT {};
DEFINE FIELD createdAt ON account_federated_identity TYPE datetime DEFAULT time::now() READONLY;
DEFINE FIELD updatedAt ON account_federated_identity TYPE datetime VALUE time::now();
DEFINE INDEX idx_account_federated_identity_subject ON account_federated_identity COLUMNS connection, issuer, subject UNIQUE;
