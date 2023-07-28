/* eslint-disable consistent-return, no-underscore-dangle, camelcase */
import _ from 'lodash';

import Dispatcher from 'main/dispatcher';
import CRUDStore from 'main/util/CRUDStore';

const AdminStore = _.extend({}, CRUDStore('admin'), {
  act(action) {
    switch (action.type) {
      case 'ADMIN_LIST':
        return this._receiveData(action.admins);

      case 'ADMIN_SUBSCRIBER_LIST':
        return this._receiveData(action.admins);

      default:

    }
  }
});

AdminStore._register(Dispatcher);

export default AdminStore;
