/* eslint-disable consistent-return, no-underscore-dangle, camelcase */
import _ from 'lodash';

import Dispatcher from 'main/dispatcher';
import CRUDStore from 'main/util/CRUDStore';

const PurchaseOrderStore = _.extend({}, CRUDStore('purchaseOrders'), {
  act(action) {
    switch (action.type) {
      case 'PURCHASE_ORDER_LIST':
        return this._receiveData(action.purchase_orders);

      default:
        return undefined;
    }
  },

  getAll() {
    return this._objects
      .get()
      .filter(x => x.get('po_approved_at') == undefined)
      .valueSeq();
  }
});

PurchaseOrderStore._register(Dispatcher);

export default PurchaseOrderStore;
