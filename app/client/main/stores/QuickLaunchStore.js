/* eslint-disable consistent-return, no-underscore-dangle, camelcase */
import _ from 'lodash';

import Dispatcher from 'main/dispatcher';
import CRUDStore from 'main/util/CRUDStore';

const QuickLaunchStore = _.extend({}, CRUDStore('quick_launches'), {
  act(action) {
    switch (action.type) {
      case 'QUICK_LAUNCH_DATA':
        return this._receiveData([action.quickLaunch]);

      default:

    }
  }
});

QuickLaunchStore._register(Dispatcher);

export default QuickLaunchStore;
