/* eslint-disable consistent-return, no-underscore-dangle, camelcase */
import _ from 'lodash';

import Dispatcher from 'main/dispatcher';
import CRUDStore from 'main/util/CRUDStore';

const LocationTypeStore = _.extend({}, CRUDStore('locationTypes'), {

  act(action) {
    switch (action.type) {
      case 'LOCATION_TYPE_DATA':
        return this._receiveData([action.locationType]);

      case 'LOCATION_TYPE_LIST':
        return this._receiveData(action.locationTypes);

      case 'LOCATION_TYPES_API_LIST':
        return this._receiveData(action.entities);

      default:
        return undefined;
    }
  },

  getAllByCategories(categories) {
    return this.getAll().filter(type => categories.contains(type.get('category')));
  }
});

LocationTypeStore._register(Dispatcher);

export default LocationTypeStore;
