/* eslint-disable consistent-return, no-underscore-dangle, camelcase */
import _ from 'lodash';

import Dispatcher from 'main/dispatcher';
import CRUDStore from 'main/util/CRUDStore';

const VendorStore = _.extend({}, CRUDStore('vendors'), {
  act(action) {
    switch (action.type) {
      case 'VENDORS_API_LIST':
        return this._receiveData(action.entities);

      case 'VENDOR_DESTROYED':
        return this._remove(action.id);

      default:
        return undefined;

    }
  }
});
VendorStore._register(Dispatcher);

export default VendorStore;
