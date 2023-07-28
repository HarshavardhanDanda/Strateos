import * as Immutable from 'immutable';

export const CONTAINER_STATUS = {
  all: 'All',
  available: 'Available',
  destroyed: 'Destroyed',
  consumable: 'Consumables',
  returned: 'Returned',
  will_be_destroyed: 'Pending Destruction',
  pending_destroy: 'Destroyed',
  pending_return: 'Pending Return',
};

export const isPhysicallyAvailable = (container) => {
  const statuses = [
    'available',
    'consumable',
    'pending_destroy',
    'pending_return'
  ];
  const physicallyAvailableStatuses = Immutable.Set(statuses);
  return physicallyAvailableStatuses.includes(container.get('status'));
};

export const formatBSLString = (bsl) => {
  return `BSL-${bsl}`;
};

export const isStock = (container) => {
  if (!container) {
    return false;
  }

  return (
    container.get('organization_id') == undefined &&
    container.getIn(['organization', 'id']) == undefined
  );
};
