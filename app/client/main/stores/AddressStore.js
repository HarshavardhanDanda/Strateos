/* eslint-disable consistent-return, no-underscore-dangle, camelcase */
import _ from 'lodash';

import Dispatcher from 'main/dispatcher';
import CRUDStore from 'main/util/CRUDStore';

const AddressStore = _.extend({}, CRUDStore('addresses'), {
  act(action) {
    switch (action.type) {
      case 'ADDRESS_DATA':
        return this._receiveData([action.address]);

      case 'ADDRESS_LIST':
        return this._receiveData(action.addresses);

      case 'ADDRESS_DESTROYED':
        return this._remove(action.id);

      case 'ADDRESSES_API_LIST':
        return this._receiveData(action.entities);

      default:

    }
  }
});

AddressStore._register(Dispatcher);

export default AddressStore;
