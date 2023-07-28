/* eslint-disable consistent-return, no-underscore-dangle, camelcase */
import CRUDStore from 'main/util/CRUDStore';
import Dispatcher from 'main/dispatcher';

import _ from 'lodash';

const OrderableMaterialComponentStore = _.extend({}, CRUDStore('orderable_material_components'), {
  getAllByOmcId(omcId) {
    return this.getAll().filter(omc => omc.get('id') === omcId);
  },

  act(action) {
    switch (action.type) {
      case 'ORDERABLE_MATERIAL_COMPONENT_LIST':
        return this._receiveData(action.omcs);

      case 'ORDERABLE_MATERIAL_COMPONENTS_API_LIST':
        return this._receiveData(action.entities);

      default:
        return undefined;

    }
  }

});

OrderableMaterialComponentStore._register(Dispatcher);

export default OrderableMaterialComponentStore;
