DEFINE TABLE belongs_to SCHEMAFULL TYPE RELATION IN account OUT organization;
DEFINE FIELD role ON belongs_to TYPE string DEFAULT 'member';
DEFINE FIELD joinedAt ON belongs_to TYPE datetime DEFAULT time::now() READONLY;
