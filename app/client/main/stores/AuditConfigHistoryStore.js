/* eslint-disable consistent-return, no-underscore-dangle, camelcase */
import _ from 'lodash';

import Dispatcher from 'main/dispatcher';
import CRUDStore from 'main/util/CRUDStore';

const AuditConfigHistoryStore = _.extend({}, CRUDStore('audit_config_history'), {
  act(action) {
    switch (action.type) {
      case 'AUDIT_CONFIGURATION_HISTORY_LIST':
        return this._receiveData(action.auditConfigHistory.content);

      default:
        return undefined;
    }
  },

  getByAuditConfigId(auditConfigId) {
    return this.getAll()
      .filter(auditConfigHistory => auditConfigHistory.get('auditConfigurationId') === auditConfigId);
  }
});

AuditConfigHistoryStore._register(Dispatcher);

export default AuditConfigHistoryStore;
