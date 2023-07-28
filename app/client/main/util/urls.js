import _ from 'lodash';

// Urls.resource(4) -> "/#{Transcriptic.organization.subdomain}/library/4"
const Urls = {};

Urls.use = function(org) {
  Urls.org = `/${org}`;
  return Urls;  // return self for chaining
};

// Utility Routes
Urls.deref = gid =>
  `/-/${gid}`;
Urls.kits = () =>
  `${Urls.org}/kits`;
Urls.categories = () =>
  `${Urls.kits()}/categories`;

Urls.orderable_material_components = () =>
  '/api/orderable_material_components';
Urls.omc_global_stats = (omc_id) =>
  `${Urls.orderable_material_components()}/${omc_id}/global_stats`;

Urls.materials = () =>
  '/api/materials';
Urls.bulk_create_materials = () =>
  `${Urls.materials()}/bulk_create_with_dependencies`;
Urls.update_material = (id) =>
  `${Urls.materials()}/${id}/update_with_dependencies`;
Urls.emolecules_flattened = () =>
  '/api/v1/vendor_catalog_service/flattened_compounds';
Urls.material_stats = (id) =>
  `${Urls.materials()}/${id}/material_stats`;

Urls.workcell_sessions = (id) =>
  `/api/v1/workcells/${id}/sessions`;

Urls.orders = () =>
  '/api/kit_orders';
Urls.material_checkin = () =>
  `${Urls.orders()}/material_checkin`;

Urls.container_types = () =>
  '/api/container_types';
Urls.container_type = id =>
  `${Urls.container_types()}/${id}`;

Urls.devices = () =>
  `${Urls.org}/devices`;
Urls.device = device_id =>
  `${Urls.org}/devices/${device_id}`;
Urls.device_events_admin = device_id =>
  `${Urls.device(device_id)}/events`;
Urls.device_events = device_id =>
  `/api/devices/${device_id}/device_events`;
Urls.s3_file = key =>
  `/upload/url_for?key=${encodeURIComponent(key)}`;

Urls.audit = () =>
  `${Urls.org}/audit`;

// Users
Urls.users = () =>
  '/users';
Urls.user = user_id =>
  `${Urls.users()}/${user_id}`;
Urls.user_update_profile_img = user_id =>
  `${Urls.user(user_id)}/update_profile_img`;
Urls.request_developer_access = user_id =>
  `${Urls.user(user_id)}/request_developer_access`;
Urls.users_edit = () =>
  `${Urls.users()}/edit`;
Urls.rotate_api_key = user_id =>
  `${Urls.user(user_id)}/api/rotate`;
Urls.sign_out = () =>
  `${Urls.users()}/sign_out`;
Urls.unmasquerade = () =>
  `${Urls.users()}/unmasquerade`;

Urls.subscriptions = (org_id, user_id) => {
  if (user_id) {
    return `/api/org_subscriptions/${org_id}?filter[userId]=${user_id}`;
  } else {
    return `/api/org_subscriptions/${org_id}`;
  }
};

Urls.topics_of_org_type = org_type =>
  `/api/topics_of_org_type/${org_type}`;
// Conversations
Urls.conversation = conversation_id =>
  `/conversations/${conversation_id}`;
Urls.posts = conversation_id =>
  `${Urls.conversation(conversation_id)}/posts`;
Urls.post = (conversation_id, post_id) =>
  `${Urls.posts(conversation_id)}/${post_id}`;

// Organization-based Routes
Urls.organizations = () =>
  '/organizations';
Urls.get_organization = (subdomain, id) =>
  `/${subdomain}?org_id=${id}`;
Urls.orgs = () =>
  '/api/organizations';

Urls.all_organizations = id =>
  `${Urls.orgs()}/${id}`;

Urls.organization = () =>
  Urls.org;

Urls.update_organization = (subdomain, orgId) =>
  `/${subdomain}?org_id=${orgId}`;

Urls.organization_overview = () =>
  `${Urls.org}/overview`;

Urls.organization_billing = () =>
  `${Urls.org}/billing`;

Urls.collaborators = () =>
  `${Urls.org}/collaborators`;
Urls.collaborator = id =>
  `${Urls.org}/collaborators/${id}`;

Urls.destroy_collaborator = (subdomain, id, orgId) =>
  `/${subdomain}/collaborators/${id}?org_id=${orgId}`;
Urls.create_collaborator = (subdomain, orgId) =>
  `/${subdomain}/collaborators?org_id=${orgId}`;

Urls.reaction = (org, id) =>
  `/${org}/reactions/${id}`;

Urls.actions = () => '/api/v1/actions';
Urls.generate_po_label_action = () => `${Urls.actions()}/invoices/generate_po_labels`;
Urls.xero_reconcile = () => `${Urls.actions()}/invoices/xero_reconcile`;
Urls.generate_netsuite_invoice = (id) => `${Urls.actions()}/invoices/${id}/generate_netsuite_invoice`;
Urls.remove_collaborators = () =>
  `${Urls.actions()}/collaborators/remove_collaborators`;

Urls.acs = () => '/api/v1/access_control';

Urls.user_acl = () =>
  `${Urls.acs()}/user_acl`;

Urls.features = () =>
  `${Urls.acs()}/feature_groups`;

Urls.permission_summary = () =>
  `${Urls.acs()}/permission_summary`;

Urls.permission_summary_by_org = () =>
  `${Urls.acs()}/permission_summary_by_org`;

Urls.cirrus = () => `${Urls.org}/workflows`;

Urls.workflow_service = () => '/api/v1/workflows';
Urls.instantiate_workflow = id => `${Urls.workflow_service()}/${id}/instantiate`;
Urls.get_workflow_definitions = () => `${Urls.workflow_service()}`;
Urls.get_workflow_definition = id => `${Urls.workflow_service()}/${id}`;
Urls.get_workflow_execution = id => `${Urls.workflow_service()}/executions/${id}`;
Urls.get_workflow_execution_groups = id => `${Urls.workflow_service()}/executions/${id}/groups`;
Urls.get_workflow_instance = id => `/transcriptic/workflows/experiments/${id}`;
Urls.get_workflow_viewer = id => `/transcriptic/workflows/viewer/${id}`;

Urls.ams = () => '/service/ams/api';
Urls.ams_workcells = () => `${Urls.ams()}/workcells`;

Urls.compounds = () =>
  `${Urls.org}/compounds`;
Urls.chemicalReactions = () =>
  `${Urls.org}/chemical_reactions`;
Urls.compound = id =>
  `${Urls.compounds()}/${id}`;
Urls.compounds_page = () =>
  `${Urls.compounds()}/compounds`;
Urls.batches_page = () =>
  `${Urls.compounds()}/batches`;

Urls.synthesis_program_item = (synthesis_program_id, item_type) =>
  `/api/v1/synthesis_programs/${synthesis_program_id}/relationships/${item_type}`;

Urls.vendor_page = () =>
  `${Urls.org}/vendor`;
Urls.material_page = () =>
  `${Urls.vendor_page()}/materials`;
Urls.material = id =>
  `${Urls.material_page()}/${id}`;
Urls.edit_material = id =>
  `${Urls.material_page()}/${id}/edit`;
Urls.new_material = () =>
  `${Urls.material_page()}/new`;
Urls.vendor_resources = () =>
  `${Urls.vendor_page()}/resources`;
Urls.vendors = () =>
  `${Urls.vendor_page()}/vendors`;
Urls.commercial_vendors = () =>
  '/_commercial/vendors';
Urls.suppliers = () =>
  `${Urls.vendor_page()}/suppliers`;
Urls.material_orders_page = () =>
  `${Urls.vendor_page()}/orders`;
Urls.material_order = id =>
  `${Urls.material_orders_page()}/${id}`;
Urls.new_material_order = () =>
  `${Urls.material_orders_page()}/new`;
Urls.material_orders_checkin_page = () =>
  `${Urls.material_orders_page()}/checkin`;
Urls.material_orders_checkin_csv_page = () =>
  `${Urls.material_orders_page()}/checkincsv`;
Urls.edit_material_order = id =>
  `${Urls.material_orders_page()}/${id}/edit`;
Urls.containers_validate_barcodes_api = () =>
  '/api/containers/validate_barcodes';
Urls.containers_validate_consumable_barcodes_api = () =>
  '/api/containers/validate_consumable_barcodes';

Urls.addresses = () =>
  `${Urls.org}/addresses`;
Urls.address = id =>
  `${Urls.addresses()}/${id}`;

Urls.address_api = (subdomain) =>
  `/${subdomain}/addresses`;
Urls.org_addresses_api = (orgId, subdomain) =>
  `${Urls.address_api(subdomain)}?org_id=${orgId}`;
Urls.org_address_api = (id, orgId, subdomain) =>
  `${Urls.address_api(subdomain)}/${id}?org_id=${orgId}`;

Urls.bulk_create_containers_api = () =>
  '/api/containers/bulk_create_containers';
Urls.bulk_request_api = () =>
  '/api/bulk_requests';

Urls.inventory = () =>
  `${Urls.org}/inventory`;
Urls.locations = () =>
  `${Urls.inventory()}/locations`;
Urls.location = id =>
  `${Urls.locations()}/${id}`;
Urls.containers = () =>
  `${Urls.inventory()}/containers`;
Urls.container = c_id =>
  `${Urls.samples()}/${c_id}`;
Urls.container_location = c_id =>
  `${Urls.inventory()}/container_location/${c_id}`;
Urls.locations_api = () => '/api/locations';
Urls.location_types_api = () =>
  '/api/location_types';
Urls.inventory_location_api = l_id =>
  `${Urls.locations_api()}/${l_id}`;
Urls.inventory_search_api = () =>
  '/api/inventory_searches';
Urls.location_deep_containers_api = l_id =>
  `${Urls.inventory_location_api(l_id)}/load_deep_containers`;
Urls.load_regions_api = () =>
  `${Urls.locations_api()}/load_regions`;
Urls.labs_with_manage_permission = () =>
  '/api/labs/labs_with_manage_permission';

Urls.idt_orders = () =>
  `${Urls.inventory()}/idt_orders`;
Urls.idt_orders_api = () =>
  '/api/idt_orders';
Urls.container_destruction_requests = () =>
  `${Urls.inventory()}/container_destruction_requests`;
Urls.container_destruction_requests_api = () =>
  '/api/container_destruction_requests';

Urls.tisos = () =>
  '/api/tisos';
Urls.tiso_reservations = () =>
  '/api/tiso_reservations';
Urls.tiso_reservations_search = () =>
  `${Urls.tiso_reservations()}/search`;
Urls.tiso_reservation = id =>
  `${Urls.tiso_reservations()}/${id}`;
Urls.tiso_reservation_retrieve = () =>
  `${Urls.tiso_reservations()}/retrieve`;
Urls.tiso_reservation_discard = () =>
  `${Urls.tiso_reservations()}/discard`;
Urls.tiso_reservation_manual_remove = () =>
  `${Urls.tiso_reservations()}/manual_remove`;
Urls.tiso_reservation_retrieve_many = () =>
  `${Urls.tiso_reservations()}/retrieve_many`;
Urls.tiso_reservation_discard_many = () =>
  `${Urls.tiso_reservations()}/discard_many`;
Urls.tiso_reservation_manual_remove_many = () =>
  `${Urls.tiso_reservations()}/manual_remove_many`;

Urls.shipments = () =>
  `${Urls.org}/shipments`;
Urls.shipments_intake_kits = () =>
  `${Urls.shipments()}/intake_kits`;
Urls.return_shipments = () =>
  `${Urls.shipments()}/return_shipments`;
Urls.lab_shipments = () =>
  `${Urls.org}/lab_shipments`;
Urls.lab_intake_kits = () =>
  `${Urls.lab_shipments()}/intake_kits`;
Urls.lab_intake_kit = (id) =>
  `${Urls.lab_shipments()}/intake_kits/${id}`;
Urls.return_lab_shipments = () =>
  `${Urls.lab_shipments()}/return`;
Urls.lab_check_in = () =>
  `${Urls.lab_shipments()}/check_in`;
Urls.lab_shipments_id = (id) =>
  `${Urls.lab_shipments()}/${id}`;
Urls.implementation_shipments = () =>
  `${Urls.lab_shipments()}/implementation`;
Urls.ships = () =>
  '/api/intake_kits';
Urls.ship = id =>
  `${Urls.ships()}/${id}`;

Urls.tisosPage = () => `${Urls.org}/tisos`;

Urls.billing_contacts = () =>
  `${Urls.org}/billing_contacts`;
Urls.billing_contact = contactId =>
  `${Urls.billing_contacts()}/${contactId}`;

Urls.customer_billing_contacts = (subdomain, orgId) =>
  `/${subdomain}/billing_contacts?org_id=${orgId}`;
Urls.customer_billing_contact = (contactId, subdomain, orgId) =>
  `/${subdomain}/billing_contacts/${contactId}?org_id=${orgId}`;

Urls.samples = () =>
  `${Urls.inventory()}/samples`;
Urls.samples_create_with_aliquots = () =>
  `${Urls.samples()}/create_with_aliquots`;
Urls.orglessContainer = c_id =>
  `/containers/${c_id}`;
Urls.orglessAliquot = (c_id, well_idx) =>
  `${Urls.orglessContainer(c_id)}/${well_idx}`;

Urls.container_runs = c_id =>
  `${Urls.container(c_id)}/runs`;
Urls.aliquot = (c_id, well_idx) =>
  `${Urls.container(c_id)}/${well_idx}`;
Urls.aliquots = c_id =>
  `${Urls.container(c_id)}/aliquots`;
Urls.aliquots_find_by_name = () =>
  `${Urls.samples()}/find_aliquots_by_name`;
Urls.aliquot_history = (c_id, well_idx) =>
  `${Urls.aliquot(c_id, well_idx)}/history`;
Urls.autoprotocol = (projectId, runId) =>
  `${Urls.run(projectId, runId)}/autoprotocol`;
Urls.container_undo_destroy = c_id =>
  `${Urls.container(c_id)}/undo_destroy`;
Urls.stale_containers = () =>
  `${Urls.inventory()}/stale_containers`;
Urls.stale_containers_api = () =>
  '/api/stale_containers';

Urls.inventory_container = (c_id) =>
  `/api/inventory/containers/${c_id}`;
Urls.containers = () =>
  '/api/containers';

Urls.container_transfer = () =>
  `${Urls.containers()}/transfer`;
Urls.are_containers_transferable = () =>
  `${Urls.containers()}/is_transferable`;

Urls.relocate_many = () =>
  `${Urls.containers()}/relocate_many`;

Urls.api_audits_path = () =>
  '/api/audits';

Urls.return_shipments_api = () =>
  `${Urls.inventory()}/return_shipments`;
Urls.return_shipments_shipability_info = () =>
  `${Urls.inventory()}/return_shipments/shipability_info`;
Urls.return_shipment = rs_id =>
  `${Urls.return_shipments_api()}/${rs_id}`;
Urls.return_shipment_authorize = rs_id =>
  `${Urls.return_shipment(rs_id)}/authorize`;
Urls.return_shipment_destroy_abandoned = rs_id =>
  `${Urls.return_shipment(rs_id)}/destroy_abandoned`;

Urls.resources = () =>
  `${Urls.org}/resources`;
Urls.resource = r_id =>
  `${Urls.resources()}/${r_id}`;
Urls.resource_many = () =>
  `${Urls.resources()}/show_many`;

Urls.shipment = id =>
  `${Urls.shipments()}/${id}`;
Urls.new_shipment = () =>
  `${Urls.shipments()}/new`;
Urls.edit_shipment = id =>
  `${Urls.shipment(id)}/edit`;
Urls.shipment_containers = id =>
  `${Urls.shipment(id)}/containers`;

Urls.intake_kits = () =>
  `${Urls.org}/intake_kits`;

Urls.payment_method = id =>
  `${Urls.org}/payment_methods/${id}`;
Urls.payment_methods = () =>
  `${Urls.org}/payment_methods`;
Urls.invoices = () =>
  `${Urls.org}/invoices`;
Urls.invoice = id =>
  `${Urls.invoices()}/${id}.pdf`;
Urls.credits = () =>
  `${Urls.org}/credits`;
Urls.payment_method_approve_api = id =>
  `/api/v1/payment_methods/${id}`;

Urls.get_payment_methods = (subdomain) =>
  `/${subdomain}/payment_methods`;
Urls.create_payment_methods = (subdomain, org_id) =>
  `/${subdomain}/payment_methods?org_id=${org_id}`;
Urls.get_invoices = (subdomain, org_id) =>
  `/${subdomain}/invoices?org_id=${org_id}`;
Urls.get_credits = (subdomain, org_id) =>
  `/${subdomain}/credits?org_id=${org_id}`;
Urls.org_payment_method = (id, subdomain, org_id) =>
  `/${subdomain}/payment_methods/${id}?org_id=${org_id}`;

Urls.video_clip_cameras = () =>
  '/videos/cameras';
Urls.new_video_clip = () =>
  '/videos/clip';
Urls.video_clip = id =>
  `/videos/clip/${id}`;

Urls.projects = () =>
  `${Urls.org}/projects`;
Urls.project = project_id =>
  `${Urls.org}/${project_id}`;
Urls.favorite_project = () =>
  `${Urls.org}/favorite`;
Urls.transfer_project = project_id =>
  `${Urls.org}/transfer/${project_id}`;

Urls.runspage = function runspage(runView, runStatus) {
  if (arguments.length === 2) {
    return `${Urls.org}/runspage/${runView}/${runStatus}`;
  } else if (arguments.length === 1) {
    return `${Urls.org}/runspage/${runView}`;
  } else return `${Urls.org}/runspage`;
};
Urls.runspage_details = (run_id, runView, runStatus) =>
  `${Urls.runspage(runView, runStatus)}/runs/${run_id}`;
Urls.runspage_quote = (run_id, runView, runStatus) =>
  `${Urls.runspage_details(run_id, runView, runStatus)}/quote`;
Urls.runspage_instructions = (run_id, runView, runStatus) =>
  `${Urls.runspage_details(run_id, runView, runStatus)}/instructions`;
Urls.runspage_prime_directive = (run_id, runView, runStatus) =>
  `${Urls.runspage_details(run_id, runView, runStatus)}/prime`;
Urls.runspage_related_runs = (run_id, runView, runStatus) =>
  `${Urls.runspage_details(run_id, runView, runStatus)}/related_runs`;
Urls.runspage_graph = (run_id, runView, runStatus) =>
  `${Urls.runspage_details(run_id, runView, runStatus)}/graph`;
Urls.runspage_support = (run_id, runView, runStatus) =>
  `${Urls.runspage_details(run_id, runView, runStatus)}/support`;
Urls.runspage_properties = (run_id, runView, runStatus) =>
  `${Urls.runspage_details(run_id, runView, runStatus)}/properties`;
Urls.runspage_admin = (run_id, runView, runStatus) =>
  `${Urls.runspage_details(run_id, runView, runStatus)}/admin`;
Urls.runspage_refs = (run_id, runView, runStatus) =>
  `${Urls.runspage_details(run_id, runView, runStatus)}/refs`;
Urls.runspage_ref = (run_id, ref_name, runView, runStatus) =>
  `${Urls.runspage_refs(run_id, runView, runStatus)}/${decodeURI(encodeURIComponent(ref_name))}`;
Urls.runspage_data = (run_id, runView, runStatus) =>
  `${Urls.runspage_details(run_id, runView, runStatus)}/data`;
Urls.runspage_generated_containers = (run_id, runView, runStatus) =>
  `${Urls.runspage_details(run_id, runView, runStatus)}/generated_containers`;
Urls.runspage_generated_container = (run_id, container_id, runView, runStatus) =>
  `${Urls.runspage_generated_containers(run_id, runView, runStatus)}/${decodeURI(encodeURIComponent(container_id))}`;
Urls.runspage_datum = (run_id, data_ref, runView, runStatus) =>
  `${Urls.runspage_data(run_id, runView, runStatus)}/${decodeURI(encodeURIComponent(data_ref))}`;
Urls.runspage_analysis_datum = (run_id, dataset_id, runView, runStatus) =>
  `${Urls.runspage_data(run_id, runView, runStatus)}/analysis/${dataset_id}`;

Urls.quick_launch = (projectId, quickLaunchId) =>
  `${Urls.org}/${projectId}/runs/quick_launch/${quickLaunchId}`;
Urls.quick_launch_resolve_inputs = (projectId, quickLaunchId) =>
  `${Urls.quick_launch(projectId, quickLaunchId)}/resolve_inputs`;
Urls.runs = project_id =>
  `${Urls.project(project_id)}/runs`;
Urls.run = (project_id, run_id) =>
  `${Urls.runs(project_id)}/${run_id}`;
Urls.run_instructions = (project_id, run_id) =>
  `${Urls.runs(project_id)}/${run_id}/instructions`;
Urls.run_warp_event_errors = (project_id, run_id) =>
  `${Urls.run(project_id, run_id)}/warp_event_errors.json`;
Urls.run_support = (project_id, run_id) =>
  `${Urls.run(project_id, run_id)}/support`;
Urls.run_properties = (project_id, run_id) =>
  `${Urls.run(project_id, run_id)}/properties`;
Urls.run_clone = (project_id, run_id) =>
  `${Urls.run(project_id, run_id)}/clone`;
Urls.run_accept = (project_id, run_id) =>
  `${Urls.run(project_id, run_id)}/accept`;
Urls.run_abort = (project_id, run_id) =>
  `${Urls.run(project_id, run_id)}/abort`;
Urls.run_cancel = (project_id, run_id) =>
  `${Urls.run(project_id, run_id)}/cancel`;
Urls.run_flag = (project_id, run_id) =>
  `${Urls.run(project_id, run_id)}/mark_flagged`;
Urls.run_quote = (project_id, run_id) =>
  `${Urls.run(project_id, run_id)}/quote`;
Urls.run_graph = (project_id, run_id) =>
  `${Urls.run(project_id, run_id)}/graph`;
Urls.run_refs = (project_id, run_id) =>
  `${Urls.run(project_id, run_id)}/refs`;
Urls.run_data = (project_id, run_id) =>
  `${Urls.run(project_id, run_id)}/data`;
Urls.run_generated_containers = (project_id, run_id) =>
  `${Urls.run(project_id, run_id)}/generated_containers`;
Urls.run_related_runs = (project_id, run_id) =>
  `${Urls.run(project_id, run_id)}/related_runs`;

Urls.run_claim = (run_id) =>
  `${Urls.run_by_id(run_id)}/claim`;
Urls.run_approval = (run_id) =>
  `${Urls.run_by_id(run_id)}/approval`;
Urls.run_reject = (run_id) =>
  `${Urls.run_by_id(run_id)}/reject`;
Urls.run_feedback = (run_id) =>
  `${Urls.run_by_id(run_id)}/feedback`;
Urls.run_priority = (run_id) =>
  `${Urls.run_by_id(run_id)}/priority`;
Urls.run_assign = (run_id) =>
  `${Urls.run_by_id(run_id)}/assign`;
Urls.run_abort = (run_id) =>
  `${Urls.run_by_id(run_id)}/abort`;

Urls.prime_directive_run = run_id =>
  `${Urls.org}/runs/${run_id}/queue/all_runs`;

Urls.create_and_execute_post_run_program = () =>
  '/api/program_executions';

// React Router wants a URI that has not been encoded with URIComponent for matching.
// Since our refs (and datarefs) can have characters like `#` we need to do some hacks.
//
// The compromise is to use decodeURI, note the missing decodeURIComponent,
// to only encode some of the reserved characters, namely `#`.
// Things like spaces are left as space characters.
Urls.run_generated_container = (project_id, run_id, container_id) =>
  `${Urls.run_generated_containers(project_id, run_id)}/${decodeURI(encodeURIComponent(container_id))}`;
Urls.run_ref = (project_id, run_id, ref_name) =>
  `${Urls.run_refs(project_id, run_id)}/${decodeURI(encodeURIComponent(ref_name))}`;
Urls.run_datum = (project_id, run_id, data_ref) =>
  `${Urls.run_data(project_id, run_id)}/${decodeURI(encodeURIComponent(data_ref))}`;

Urls.run_preview = preview_id =>
  `/runs/preview/${preview_id}`;
Urls.run_analysis_datum = (project_id, run_id, dataset_id) =>
  `${Urls.run_data(project_id, run_id)}/analysis/${dataset_id}`;
Urls.run_dependencies = (project_url, run_id) =>
  `${Urls.run(project_url, run_id)}/dependencies`;
Urls.run_admin = (project_id, run_id) =>
  `${Urls.run(project_id, run_id)}/admin`;
Urls.run_instruction = (project_id, run_id, instruction_id) =>
  `${Urls.run(project_id, run_id)}/${instruction_id}`;
Urls.run_launch = (project_id, protocol_id) =>
  `${Urls.project(project_id)}/launch/${protocol_id}`;
Urls.execute_run = (project_id, run_id) =>
  `${Urls.run(project_id, run_id)}/complete_all_instructions`;
Urls.sensor_data = data_name =>
  `/sensor_data/${data_name}`;
Urls.queries = project_id =>
  `${Urls.project(project_id)}/queries`;
Urls.query = (project_id, id) =>
  `${Urls.queries(project_id)}/${id}`;

Urls.support_tickets = (project_id, run_id) =>
  `${Urls.run(project_id, run_id)}/support_tickets`;

// Our analytical data does not have unified shape or routing across data types. This is a list of dataset types which
// require `key=*` in the query params in order to get the data itself instead of the metadata.
Urls.dataset_types = [
  'autopick',
  'envision_platereader',
  'image-plate',
  'measure',
  'mesoscale_platereader',
  'platereader',
  'qpcr',
  'sanger_sequence',
  'thermocycle'
];

Urls.dataset = id =>
  `/datasets/${id}`;

Urls.project_dataset = (project_id, dataset_id) =>
  `${Urls.project(project_id)}/datasets/${dataset_id}`;

// Route to the data for a dataset.
Urls.dataset_data = function(datasetId, dataType) {
  if (_.includes(Urls.dataset_types, dataType)) {
    return `${Urls.dataset(datasetId)}?format=json&key=*`;
  }
  return `${Urls.dataset(datasetId)}.json`;
};

// Similar to `Urls.dataset_data`, but supports formats other than json (including `raw` for S3 files).
Urls.dataset_download = function(id, data_type, format) {
  if ((format === 'json') && _.includes(Urls.dataset_types, data_type)) {
    return Urls.dataset_data(id, data_type);
  } else if (data_type === 'autopick') {
    // Special-case hack for autopick. We don't show JSON to customers, since it's meaningless to them. Instead we
    // offer two ways to view the plate image = A link to the normalized image from S3; and link to a react component
    // which renders colony markings on the image (technically not a download).
    if (format === 'PLAIN IMAGE') {
      return `${Urls.dataset(id)}.raw?sub=normalized`;
    } else {
      return `${Urls.dataset(id)}/colony`;
    }
  }
  return `${Urls.dataset(id)}.${format}`;
};

Urls.notebooks = project_id =>
  `${Urls.project(project_id)}/notebooks`;
Urls.notebook = (project_id, id) =>
  `${Urls.notebooks(project_id)}/${id}`;
Urls.fork_notebook = (project_id, id) =>
  `${Urls.notebook(project_id, id)}/fork`;

Urls.analyze_run = () =>
  `${Urls.org}/analyze_run`;

Urls.all_protocols = () =>
  `${Urls.org}/protocols`;
Urls.protocols_for_project = () =>
  `${Urls.all_protocols()}/all_for_project`;
Urls.protocols_for_release = () =>
  `${Urls.all_protocols()}/all_for_release`;
Urls.all_protocols_for_package = package_id =>
  `${Urls.package(package_id)}/protocols/all_protocols_for_package`;
Urls.protocol = id =>
  `${Urls.all_protocols()}/${id}`;

//
// Launch Requests
//
Urls.launch_requests = protocol_id =>
  `${Urls.protocol(protocol_id)}/launch`;
Urls.launch_request = (protocol_id, req_id) =>
  `${Urls.protocol(protocol_id)}/launch/${req_id}`;

Urls.packages = () =>
  `${Urls.org}/packages`;
Urls.package = package_id =>
  `${Urls.packages()}/${package_id}`;
Urls.package_protocols = package_id =>
  `${Urls.package(package_id)}/protocols`;
Urls.protocol_page = (package_id, protocol_name) =>
  `${Urls.package_protocols(package_id)}/${protocol_name}`;
Urls.package_protocol = (package_id, protocol_id) =>
  `${Urls.package_protocols(package_id)}/${protocol_id}`;
Urls.package_workflows = package_id =>
  `${Urls.package(package_id)}/workflows`;
Urls.package_workflow = (package_id, workflow_id) =>
  `${Urls.package_workflows(package_id)}/${workflow_id}`;
Urls.package_analysis_steps = package_id =>
  `${Urls.package(package_id)}/analysis_steps`;
Urls.package_analysis_step = (package_id, step_id) =>
  `${Urls.package_analysis_step(package_id)}/${step_id}`;

Urls.customers = () =>
  `${Urls.org}/customers`;
Urls.customer_users = () =>
  `${Urls.customers()}/users`;
Urls.customer_organizations = () =>
  `${Urls.customers()}/organizations`;
Urls.customer_user = id =>
  `${Urls.customers()}/users/${id}`;

Urls.users_search_api = () =>
  '/api/users/search';

Urls.reset_2fa_attempts = id =>
  `/api/users/${id}/reset_second_factor_attempts`;

Urls.trigger_new_2fa = id =>
  `/api/users/${id}/disable_2fa`;

Urls.force_password_reset = id =>
  `/api/users/${id}/force_password_reset`;

Urls.organization_search_api = () =>
  '/api/organizations/search';

Urls.customer_organization = (id) =>
  `${Urls.customers()}/organization/${id}`;
Urls.update_organization = (subdomain, orgId) =>
  `/${subdomain}?org_id=${orgId}`;

Urls.releases = package_id =>
  `${Urls.package(package_id)}/releases`;
Urls.releases_for_package = package_id =>
  `${Urls.releases(package_id)}/all_for_package`;
Urls.release = (pkg_id, id) =>
  `${Urls.releases(pkg_id)}/${id}`;
Urls.retract_protocol = id =>
  `${Urls.protocol(id)}/retract`;
Urls.publish_protocol = id =>
  `${Urls.protocol(id)}/publish`;
Urls.publish_release = (pkg_id, id) =>
  `${Urls.releases(pkg_id)}/${id}/publish`;
Urls.retract_release = (pkg_id, id) =>
  `${Urls.releases(pkg_id)}/${id}/retract`;

Urls.scheduler_stats = () =>
  '/api/users/scheduler_stats';

Urls.provision_specs = () =>
  '/api/provision_specs';
Urls.run_by_id = run_id =>
  `/api/runs/${run_id}`;
Urls.datasets = () =>
  '/api/datasets';
Urls.dataset_prime = (id) =>
  `/api/datasets/${id}`;
Urls.dataset_prime_directive = () =>
  `${Urls.datasets()}/prime_directive`;
Urls.provision_specs_for_resource = () =>
  '/runs/provision_specs_for_resource';
Urls.provision_specs = run_id =>
  `${Urls.run_by_id(run_id)}/provision_specs`;
Urls.auto_create = (run_id) =>
  `${Urls.provision_specs(run_id)}/auto_create`;

Urls.complete_instruction = (run_id, id) =>
  `/api/runs/${run_id}/instructions/${id}/complete`;
Urls.undo_instruction = (run_id, id) =>
  `/api/runs/${run_id}/instructions/${id}/undo`;
Urls.generate_execution_support_artifact = (run_id) =>
  `/api/runs/${run_id}/execution_support_artifacts/generate`;

/*
 * Uploads
 */
Urls.uploads = () =>
  '/api/uploads';

Urls.upload_part = uploadId =>
  `/api/uploads/${uploadId}/upload_part`;

Urls.complete_upload = uploadId =>
  `/api/uploads/${uploadId}/complete`;

Urls.sessions = () =>
  '/users/info';

Urls.protocol_implementations = () =>
  `${Urls.org}/protocol_implementations`;

Urls.sessions = () =>
  '/users/info';

Urls.protocol_implementations = () =>
  `${Urls.org}/protocol_implementations`;

Urls.logURL = deviceId =>
  `http://logs.r23s.net/#/discover?_a=(columns:!(shipper,message),filters:!(!n,(
    meta:(disabled:!f,index:%5Bfilebeat-%5DYYYY.MM.DD,key:type,negate:!f,value:tcle-log)
    ,query:(match:(type:(query:tcle-log,type:phrase))))),index:%5Bfilebeat-%5DYYYY.MM.DD,
    interval:auto,query:(query_string:(analyze_wildcard:!t,query:'level_value:%3E10000%20AND%20shipper:
    %22${deviceId}%22')),sort:!('@timestamp',desc))&_g=(time:(from:now-4h,mode:quick,to:now))`;

Urls.custom_properties_configs = () => '/api/contextual_custom_properties_configs';

Urls.ams_managed_submittable_services = (labId) => `/service/ams/api/services/submittable?filter[labId]=${labId}`;

/*
* Billing
*/
Urls.billing = () =>  `${Urls.org}/bills`;
Urls.history = () => `${Urls.billing()}/history`;
Urls.pending_invoices = () => `${Urls.billing()}/pending_invoice`;
Urls.forgive_invoices = () => `${Urls.billing()}/forgive_invoices`;
Urls.remit_invoices = () => `${Urls.billing()}/remit_invoices`;
Urls.po_approval = () => `${Urls.billing()}/po_approvals`;
Urls.quality_control = () => `${Urls.billing()}/quality_control`;
Urls.apply_credit_to_invoice = (subdomain, invoiceId) => `/${subdomain}/invoices/${invoiceId}/apply_credit`;

/*
 * Operator dashboard
 */
Urls.operator_dashboard = () => `${Urls.org}/operator_dashboard`;
Urls.operator_dashboard_deref = (workcellUUID) => `${Urls.org}/operator_dashboard/-/${workcellUUID}`;

/*
 * Audit Trail
 */

Urls.audit_trail = () => '/service/audit_trail';

Urls.audit_configuration = (org_id) =>
  `${Urls.audit_trail()}/api/v1/audit-configuration/${org_id}`;

Urls.audit_configuration_history = (org_id) =>
  `${Urls.audit_trail()}/api/v1/audit-configuration/${org_id}/history`;

/*
 * Mixtures
 */
Urls.mixtures = (id) =>
  `/api/mixtures/${id}`;

/*
 * Bulk Data Ingestor Service
 */
Urls.bulk_data_ingestor = () => '/service/BULK_INGESTION';

Urls.bulk_data_ingestor_validate = () =>
  `${Urls.bulk_data_ingestor()}/api/v1/jobs/validate`;

Urls.bulk_data_ingestor_upload = () =>
  `${Urls.bulk_data_ingestor()}/api/v1/jobs`;

export default Urls;
