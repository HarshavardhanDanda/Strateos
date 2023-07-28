/* eslint-disable consistent-return, no-underscore-dangle, camelcase */
import _ from 'lodash';

import CRUDStore from 'main/util/CRUDStore';
import Dispatcher from 'main/dispatcher';

const NotificationStore = _.extend({}, CRUDStore('notifications'), {
  act(action) {
    switch (action.type) {
      case 'NOTIFICATION_SHOW':
        return this._receiveData([action.notification]);

      case 'NOTIFICATION_DISMISS':
        return this._remove(action.id);

      default:

    }
  }
});

NotificationStore._register(Dispatcher);

export default NotificationStore;
