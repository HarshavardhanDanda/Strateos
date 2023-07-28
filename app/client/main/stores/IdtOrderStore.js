/* eslint-disable consistent-return, no-underscore-dangle, camelcase */
import _ from 'lodash';

import CRUDStore from 'main/util/CRUDStore';
import Dispatcher from 'main/dispatcher';

const IdtOrderStore = _.extend({}, CRUDStore('idt_orders'), {

  act(action) {
    switch (action.type) {
      case 'IDT_ORDERS_API_LIST':
        return this._receiveData(action.entities);
      case 'IDT_ORDERS_SEARCH_RESULTS':
        return this._receiveData(action.results);
      case 'IDT_ORDER':
        return this._receiveData([action.idt_order]);
      default:
    }
  }
});

IdtOrderStore._register(Dispatcher);

export default IdtOrderStore;
