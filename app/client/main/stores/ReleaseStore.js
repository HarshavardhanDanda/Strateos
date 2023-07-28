/* eslint-disable consistent-return, no-underscore-dangle, camelcase */
import _ from 'lodash';

import CRUDStore from 'main/util/CRUDStore';
import Dispatcher from 'main/dispatcher';

const ReleaseStore = _.extend({}, CRUDStore('releases'), {

  act(action) {
    switch (action.type) {
      case 'RELEASE_LIST':
        return this._receiveData(action.releases);

      case 'RELEASE_DATA':
        return this._receiveData([action.release]);

      default:

    }
  },

  getAllForPackage(package_id) {
    return this.getAll()
      .filter(r => r.get('package_id')  === package_id);
  }
});

ReleaseStore._register(Dispatcher);

export default ReleaseStore;
