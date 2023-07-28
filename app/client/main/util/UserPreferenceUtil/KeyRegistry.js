/**
 * Local Storage Key Registry
 * Establish a central registry ONLY for local storage purpose
 * Both Key and value must be "unique" in the APP to ensure data accuracy
 * during save, get, remove.
 */
const KeyRegistry = {
  // Materials
  MATERIAL_ORDERS_TABLE: 'material-orders-table',
  MATERIALS_TABLE: 'materials-table',
  MATERIALS_TABLE_INDIVIDUAL: 'materials-table-individual',
  MATERIAL_ORDERS_GROUP_CHECKIN_FORM_TABLE: 'material-orders-group-checkin-form-table',
  MATERIAL_ORDERS_INDIVIDUAL_CHECKIN_FORM_TABLE: 'material-orders-individual-checkin-form-table',
  MATERIAL_INDIVIDUAL_SELECTOR_TABLE: 'material-individual-selector-table',
  MATERIAL_GROUP_SELECTOR_TABLE: 'material-group-selector-table',
  MATERIAL_VENDORS_CATALOG_TABLE: 'material-vendors-catalog-table',
  MATERIAL_RESOURCES_TABLE: 'material-resources-table',
  // Compounds
  COMPOUNDS_TABLE: 'compounds-table',
  BATCHES_TABLE: 'batches-table',
  COMPOUND_DETAIL_INVENTORY_TABLE: 'compound-detail-inventory-table',
  // Containers
  CONTAINERS_TABLE: 'containers-table',
  // User Account
  CUSTOMERS_ORGANIZATIONS_TABLE: 'customers-organizations-table',
  CUSTOMERS_USERS_TABLE: 'customers-users-table',
  // Admin User
  ADMIN_CUSTOMERS_ORGANIZATIONS_TABLE: 'admin-customers-organizations-table',
  ADMIN_CUSTOMERS_USERS_TABLE: 'admin-customers-users-table',
  ADMIN_CUSTOMERS_ADMIN_USERS_TABLE: 'admin-customers-admin-users-table',
  // Devices
  DEVICES_TABLE: 'devices-table',
  // Reactions
  REACTIONS_COMPOUND_LINKED_CONTAINERS_TABLE: 'reactions-compound-linked-containers-table',
  REACTIONS_COMPOUND_LINKED_MATERIALS_TABLE: 'reactions-compound-linked-materials-table',
  // Runs
  COMMON_RUNS_TABLE: 'common-runs-table',
  // Lab Shipments
  SHIPMENT_LAB_INTAKE_KITS_TABLE: 'shipment-lab-intake-kits-table',
  // Preferred Container Relocation Id
  PREFERRED_CONTAINER_RELOCATION_ID: 'preferred-container-relocation-id'
};

export default KeyRegistry;
