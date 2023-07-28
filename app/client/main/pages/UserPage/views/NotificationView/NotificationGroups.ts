export const projectNotificationsGroup = 'project-notification-group';
export const shipmentNotificationsGroup  = 'shipment-notification-group';
export const inventoryNotificationsGroup  = 'inventory-notification-group';
export const TopicIdentifiers = {
  run: 'run.status.*',
  container: 'container',
  shipment: 'shipment',
  intake_kit: 'intake_kit',
};
export const NotificationGroups = {};

NotificationGroups[projectNotificationsGroup] = [
  'notify_for_my_run_status',
  'notify_for_org_run_status',
  'notify_for_my_run_schedule',
  'notify_for_org_run_schedule',
];
NotificationGroups[shipmentNotificationsGroup] = [
  'notify_for_my_intake_kit_shipped',
  'notify_for_intake_kit_shipped',
  'notify_for_my_shipment_checked_in',
  'notify_for_shipment_checked_in',
];

NotificationGroups[inventoryNotificationsGroup] = ['notify_for_stale_container'];

NotificationGroups[projectNotificationsGroup].disabled = false;
NotificationGroups[shipmentNotificationsGroup].disabled = false;
NotificationGroups[inventoryNotificationsGroup].disabled = false;
