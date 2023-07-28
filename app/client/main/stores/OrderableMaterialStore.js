/* eslint-disable consistent-return, no-underscore-dangle, camelcase */
import _ from 'lodash';

import CRUDStore from 'main/util/CRUDStore';
import Dispatcher from 'main/dispatcher';

const OrderableMaterialStore = _.extend({}, CRUDStore('orderable_materials'), {
  act(action) {
    switch (action.type) {
      case 'ORDERABLE_MATERIALS_API_LIST':
        return this._receiveData(action.entities);

      default:
        return undefined;

    }
  }

});

OrderableMaterialStore._register(Dispatcher);

export default OrderableMaterialStore;
