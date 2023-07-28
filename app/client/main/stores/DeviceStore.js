/* eslint-disable consistent-return, no-underscore-dangle, camelcase */
import _ from 'lodash';

import Dispatcher from 'main/dispatcher';
import CRUDStore from 'main/util/CRUDStore';

const DeviceStore = _.extend({}, CRUDStore('devices'), {
  act(action) {
    switch (action.type) {
      case 'DEVICES_API_LIST':
        return this._receiveData(action.entities);

      case 'DEVICE_DESTROYED':
        return this._remove(action.id);

      default:
        return undefined;

    }
  },

  getAllByLocationId(locationId) {
    return this.getAll().filter(r => r.get('location_id') === locationId);
  },

  getDateFormatStr() {
    return 'MMM D, YYYY';
  }
});
DeviceStore._register(Dispatcher);

export default DeviceStore;
