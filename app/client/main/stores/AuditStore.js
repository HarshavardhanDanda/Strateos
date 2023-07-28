/* eslint-disable consistent-return, no-underscore-dangle, camelcase */
import _ from 'lodash';

import CRUDStore           from 'main/util/CRUDStore';
import Dispatcher          from 'main/dispatcher';

const AuditStore = _.extend({}, CRUDStore('audits'), {
  act(action) {
    switch (action.type) {
      case 'AUDITS_DATA':
        return this._receiveData([action.audits]);

      case 'AUDITS_API_LIST':
        return this._receiveData(action.entities);

      default:
        return undefined;
    }
  }
});

AuditStore._register(Dispatcher);

export default AuditStore;
