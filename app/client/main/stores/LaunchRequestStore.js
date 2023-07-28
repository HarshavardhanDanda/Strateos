/* eslint-disable consistent-return, no-underscore-dangle, camelcase */
import _ from 'lodash';

import Dispatcher from 'main/dispatcher';
import CRUDStore from 'main/util/CRUDStore';

const LaunchRequestStore = _.extend({}, CRUDStore('launch_requests'), {
  act(action) {
    switch (action.type) {
      case 'LAUNCH_REQUESTS_API_LIST':
        return this._receiveData(action.entities);
      default:
    }
  }
});

LaunchRequestStore._register(Dispatcher);

export default LaunchRequestStore;
