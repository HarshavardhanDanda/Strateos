/* eslint-disable consistent-return, no-underscore-dangle, camelcase */
import _ from 'lodash';

import Dispatcher from 'main/dispatcher';
import CRUDStore from 'main/util/CRUDStore';

const PaymentMethodStore = _.extend({}, CRUDStore('payment_methods'), {
  act(action) {
    switch (action.type) {
      case 'PAYMENT_METHOD_CREATED': case 'PAYMENT_METHOD_DATA':
        return this._receiveData([action.payment_method]);

      case 'PAYMENT_METHOD_LIST':
        return this._receiveData(action.payment_methods);

      case 'PAYMENT_METHODS_API_LIST':
        return this._receiveData(action.entities);

      case 'PAYMENT_METHOD_DESTROYED':
        return this._remove(action.id);

      default:

    }
  },

  getAllPurchaseOrders() {
    return this.getAll()
      .filter(x => x.get('type') === 'PurchaseOrder')
      .toList();
  },

  // Get all payment methods that are pending some sort of action by an
  // administrator.
  getAllPending() {
    return this.getAllPurchaseOrders()
      .filter(x => !x.get('po_approved_at'))
      .toList();
  },

  getDefault() {
    return this.getAll().find(x => x.get('is_default?'));
  },

  getPurchaseOrders() {
    return this._objects
      .get()
      .filter(x =>  x.get('payment_type') === 'PurchaseOrder' && !x.get('po_approved_at') && !x.get('deleted_at'))
      .valueSeq();
  }
});

PaymentMethodStore._register(Dispatcher);

export default PaymentMethodStore;
