/* eslint-disable consistent-return, no-underscore-dangle, camelcase */
import _ from 'lodash';

import Dispatcher from 'main/dispatcher';
import CRUDStore from 'main/util/CRUDStore';

const MaterialOrderStore = _.extend({}, CRUDStore('MaterialOrders'), {
  act(action) {
    switch (action.type) {
      case 'MATERIAL_ORDER_LIST':
        return this._receiveData(action.results);

      case 'MATERIAL_ORDERS_DATA':
        return this._receiveData(action.results);

      default:

    }
  }
});

MaterialOrderStore._register(Dispatcher);

export default MaterialOrderStore;
