/* eslint-disable consistent-return, no-underscore-dangle, camelcase */
import _ from 'lodash';

import Dispatcher from 'main/dispatcher';
import CRUDStore from 'main/util/CRUDStore';

const KitOrderStore = _.extend({}, CRUDStore('kitOrders'), {
  act(action) {
    switch (action.type) {
      case 'KIT_ORDER_DATA':
        return this._receiveData([action.order]);

      case 'KIT_ORDER_LIST':
        return this._receiveData(action.orders);

      case 'KIT_ORDERS_API_LIST':
        return this._receiveData(action.entities);

      case 'KIT_ORDER_DELETE':
        return this._remove(action.id);

      case 'KIT_ORDERS_DELETE':
        return action.ids.forEach(id => {
          this._remove(id);
        });

      case 'KIT_ORDER_CHECKIN':
        return this._receiveData([action.order]);

      default:

    }
  }
});

KitOrderStore._register(Dispatcher);

export default KitOrderStore;
