import _ from 'lodash';

import Dispatcher from 'main/dispatcher';
import CRUDStore from 'main/util/CRUDStore';
import SessionStore from 'main/stores/SessionStore';

const LabConsumerStore = _.extend({}, CRUDStore('lab_consumers'), {
  act(action) {
    switch (action.type) {
      case 'LAB_CONSUMERS_API_LIST':
        return this._receiveData(action.entities);

      default: return undefined;
    }
  },

  isOrgFilterApplicable(loggedInUserOrgId) {
    const labConsumers = this.getAll();
    let orgFilterApplicable = false;
    if (labConsumers.size > 0) {
      orgFilterApplicable = labConsumers.size > 1;
      if (labConsumers.size === 1) {
        if (labConsumers.getIn([0, 'organization', 'id']) !== loggedInUserOrgId) {
          orgFilterApplicable = true;
        }
      }
    }
    return orgFilterApplicable;
  },

  getAllForOrg(orgId) {
    return this
      .getAll()
      .filter(i => orgId === i.getIn(['organization', 'id'])).toList();
  },

  getAllForCurrentOrg() {
    return this
      .getAll()
      .filter(i => SessionStore.getOrg().get('id') === i.getIn(['organization', 'id'])).toList();
  }
});

LabConsumerStore._register(Dispatcher);

export default LabConsumerStore;
