/* eslint-disable consistent-return, no-underscore-dangle, camelcase */
import _ from 'lodash';

import Dispatcher from 'main/dispatcher';
import CRUDStore from 'main/util/CRUDStore';

const IntakeKitStore = _.extend({}, CRUDStore('intakekits'), {
  act(action) {
    switch (action.type) {

      case 'INTAKE_KIT_LIST':
        return this._receiveData(action.intakeKits);

      case 'INTAKE_KITS_API_LIST':
        return this._receiveData(action.entities);

      case 'INTAKE_KIT_DATA':
        return this._receiveData([action.intakeKit]);

      case 'INTAKE_KIT_REMOVED':
        return this._remove(action.intakeKit.id);

      default:

    }
  },

  getByOrgId(orgId) {
    return this.getAll().filter(intakeKit => intakeKit.get('organization_id') === orgId);
  }
});

IntakeKitStore._register(Dispatcher);

export default IntakeKitStore;
