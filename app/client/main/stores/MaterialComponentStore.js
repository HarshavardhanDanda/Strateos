/* eslint-disable consistent-return, no-underscore-dangle, camelcase */
import CRUDStore from 'main/util/CRUDStore';
import Dispatcher from 'main/dispatcher';

import _ from 'lodash';

const MaterialComponentStore = _.extend({}, CRUDStore('material_components'), {
  act(action) {
    switch (action.type) {
      case 'MATERIAL_COMPONENTS_API_LIST':
        return this._receiveData(action.entities);

      default:
        return undefined;

    }
  }
});

MaterialComponentStore._register(Dispatcher);

export default MaterialComponentStore;
