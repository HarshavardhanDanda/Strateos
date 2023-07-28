/* eslint-disable consistent-return, no-underscore-dangle, camelcase */
import _ from 'lodash';

import Dispatcher from 'main/dispatcher';
import CRUDStore from 'main/util/CRUDStore';

const SupplierStore = _.extend({}, CRUDStore('suppliers'), {
  act(action) {
    switch (action.type) {
      case 'SUPPLIERS_API_LIST':
        return this._receiveData(action.entities);

      case 'SUPPLIER_DESTROYED':
        return this._remove(action.id);

      default:
        return undefined;
    }
  }
});
SupplierStore._register(Dispatcher);

export default SupplierStore;
