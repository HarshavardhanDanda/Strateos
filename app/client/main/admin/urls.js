const AdminUrls = {};

AdminUrls.base = () =>
  '/admin';

AdminUrls.supply_chain = () =>
  `${AdminUrls.base()}/supply-chain`;
AdminUrls.admins = () =>
  `${AdminUrls.base()}/admins/`;
AdminUrls.search_admins = () =>
  `${AdminUrls.base()}/admins/search`;

AdminUrls.organizations = () =>
  `${AdminUrls.base()}/organizations`;
AdminUrls.organization = id =>
  `${AdminUrls.organizations()}/${id}`;

AdminUrls.customers = () =>
  `${AdminUrls.base()}/customers`;
AdminUrls.customer_users = () =>
  `${AdminUrls.customers()}/users`;
AdminUrls.customer_user = id =>
  `${AdminUrls.customers()}/users/${id}`;

AdminUrls.users = () =>
  `${AdminUrls.base()}/users`;
AdminUrls.user = id =>
  `${AdminUrls.users()}/${id}`;
AdminUrls.reset_2fa_attempts = id =>
  `${AdminUrls.users()}/${id}/reset_second_factor_attempts`;
AdminUrls.trigger_new_2fa = id =>
  `${AdminUrls.users()}/${id}/trigger_new_2fa`;
AdminUrls.force_password_reset = id =>
  `${AdminUrls.users()}/${id}/force_password_reset`;
AdminUrls.manage_feature_groups = (id) =>
  `${AdminUrls.users()}/${id}/manage_feature_groups`;
AdminUrls.masquerade = id =>
  `/users/${id}/masquerade`;
AdminUrls.scheduler_stats = () =>
  `${AdminUrls.base()}/scheduler_stats`;

AdminUrls.billing = () =>
  `${AdminUrls.base()}/billing`;
AdminUrls.oAuth = () => '/oauth/applications';

AdminUrls.amsDeviceManager = () =>
  `${AdminUrls.base()}/device_manager`;

AdminUrls.sign_out = () =>
  '/admins/sign_out';

AdminUrls.implementation_items = () =>
  `${AdminUrls.admin_inventory()}/implementation_items`;
AdminUrls.implementation_item = id =>
  `${AdminUrls.implementation_items()}/${id}`;

AdminUrls.implementations = () =>
  `${AdminUrls.base()}/implementations`;

AdminUrls.apply_credit_to_invoice = invoiceId =>
  `${AdminUrls.base()}/invoices/${invoiceId}/apply_credit`;

export default AdminUrls;
