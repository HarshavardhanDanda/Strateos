/* eslint-disable consistent-return, no-underscore-dangle, camelcase */
import _ from 'lodash';

import Dispatcher from 'main/dispatcher';
import CRUDStore from 'main/util/CRUDStore';

const CollaboratorStore = _.extend({}, CRUDStore('collaborators'), {
  act(action) {
    switch (action.type) {
      case 'COLLABORATOR_LIST':
        return this._receiveData(action.collaborators);

      case 'COLLABORATOR_DATA':
        return this._receiveData([action.collaborator]);

      case 'COLLABORATOR_DESTROYED':
        return this._remove(action.id);

      default:

    }
  },

  getOrganizationCollaboratorsForUser(userId) {
    return this.getAll()
      .filter(c => c.get('collaborating_id') === userId &&
                            c.get('collaborative_type') === 'Organization');
  },

  getOrganizationCollaborators(orgId) {
    return this.getAll()
      .filter(c => c.get('collaborative_id') === orgId &&
                            c.get('collaborative_type') === 'Organization');
  }
});

CollaboratorStore._register(Dispatcher);

export default CollaboratorStore;
