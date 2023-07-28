/* eslint-disable consistent-return, no-underscore-dangle, camelcase */
import _ from 'lodash';

import CRUDStore from 'main/util/CRUDStore';
import Dispatcher from 'main/dispatcher';

const TisoReservationStore = _.extend({}, CRUDStore('tiso_reservations'), {
  act(action) {
    switch (action.type) {
      case 'TISO_RESERVATION_LIST':
        return this._receiveData(action.reservations);
      case 'TISO_RESERVATIONS_API_LIST':
        return this._receiveData(action.entities);
      default:

    }
  },

  getAllByDeviceIds(deviceIds) {
    return this.getAll().filter(r => {
      return deviceIds.includes(r.get('device_id'));
    });
  },

  getReservations() {
    return this.getAll().filter(r => r.get('status') === 'pending');
  },

  getOccupants() {
    return this.getAll().filter(r => r.get('status') === 'in_progress');
  }
});

TisoReservationStore._register(Dispatcher);

export default TisoReservationStore;
