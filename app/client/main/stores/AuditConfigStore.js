/* eslint-disable consistent-return, no-underscore-dangle, camelcase */
import _ from 'lodash';

import Dispatcher from 'main/dispatcher';
import CRUDStore from 'main/util/CRUDStore';

const AuditConfigStore = _.extend({}, CRUDStore('audit_config'), {
  act(action) {
    switch (action.type) {
      case 'AUDIT_CONFIGURATION_DATA':
        return this._receiveData([action.auditConfig]);

      default:
        return undefined;
    }
  },

  getByOrganizationId(organizationId) {
    return this.getAll()
      .filter(auditConfig => auditConfig.get('organizationId') === organizationId);
  }
});

AuditConfigStore._register(Dispatcher);

export default AuditConfigStore;
