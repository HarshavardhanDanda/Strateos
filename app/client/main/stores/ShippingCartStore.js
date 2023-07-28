/* eslint-disable consistent-return, no-underscore-dangle, camelcase */
import _ from 'lodash';

import CRUDStore from 'main/util/CRUDStore';
import Dispatcher from 'main/dispatcher';
import ContainerStore from 'main/stores/ContainerStore';

// The shipping cart store only stores container ids, not full containers.
// To deference, correlate the ids found here with the ids in ContainerStore,
// as seen in the getContainers() method.
const ShippingCartStore = _.extend({}, CRUDStore('shipping_cart', true), {
  act(action) {
    switch (action.type) {
      case 'SHIPPING_CART_ADD':
        return this._receiveData([{ id: action.id }]);

      case 'SHIPPING_CART_REMOVE':
        return this._remove(action.id);

      case 'SHIPPING_CART_EMPTY':
        return this._empty();

      default:

    }
  },

  getContainers() {
    return ContainerStore.getByIds(this.keys());
  },

  allContainersReady() {
    return _.compact(this.getContainers().toJS()).length === this.keys().size;
  }
}
);

ShippingCartStore._register(Dispatcher);

export default ShippingCartStore;
