/* eslint-disable consistent-return, no-underscore-dangle, camelcase */
import _ from 'lodash';

import Dispatcher from 'main/dispatcher';
import CRUDStore from 'main/util/CRUDStore';

const ProvisionSpecStore = _.extend({}, CRUDStore('provision_specs'), {
  act(action) {
    switch (action.type) {
      case 'PROVISION_SPEC_DATA': {
        const oldProvisionSpec = this.findByInstruction(action.provisionSpec.instruction_id);
        if (oldProvisionSpec) {
          this._remove(oldProvisionSpec.get('id'));
        }
        return this._receiveData([action.provisionSpec]);
      }

      case 'PROVISION_SPEC_LIST':
        return this._receiveData(action.provisionSpecs);

      default:
    }
  },

  findByInstruction(instructionId) {
    return this.getAll().find(ps => ps.get('instruction_id') === instructionId);
  },

  findByInstructions(instructionIds) {
    return this.getAll().filter(ps => _.includes(instructionIds, ps.get('instruction_id')));
  },

  findByResource(resourceId) {
    return this.getAll().filter(ps => ps.get('resource_id') === resourceId);
  }
});

ProvisionSpecStore._register(Dispatcher);

export default ProvisionSpecStore;
