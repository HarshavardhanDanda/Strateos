/* eslint-disable consistent-return, no-underscore-dangle, camelcase */
import _ from 'lodash';

import CRUDStore from 'main/util/CRUDStore';
import Dispatcher from 'main/dispatcher';

const ImplementationItemStore = _.extend({}, CRUDStore('implementation_items'), {

  act(action) {
    switch (action.type) {
      case 'IMPLEMENTATION_ITEM_DATA':
        return this._receiveData([action.implementationItem]);
      case 'IMPLEMENTATION_ITEM_LIST':
        return this._receiveData(action.implementationItems);
      case 'IMPLEMENTATION_ITEM_DESTROYED':
        return this._remove(action.id);
      case 'IMPLEMENTATION_ITEMS_API_LIST':
        return this._receiveData(action.entities);
      default:

    }
  },

  getItemsByShipmentID(id) {
    return this.getAll().filter(c => c.get('shipment_id') === id).toList();
  },

  getItemByID(itemID) {
    return this.getAll().filter(c => c.get('id') === itemID);
  }
});

ImplementationItemStore._register(Dispatcher);

export default ImplementationItemStore;
