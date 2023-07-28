/* eslint-disable consistent-return, no-underscore-dangle, camelcase */
import _ from 'lodash';

import CRUDStore from 'main/util/CRUDStore';
import Dispatcher from 'main/dispatcher';

const ReturnShipmentStore = _.extend({}, CRUDStore('return_shipments'), {
  act(action) {
    switch (action.type) {
      case 'RETURN_SHIPMENT_DATA':
        return this._receiveData([action.returnShipment]);

      case 'RETURN_SHIPMENT_DELETED':
        return this._remove(action.id);

      case 'RETURN_SHIPMENT_LIST':
        return this._receiveData(action.returnShipments);

      case 'RETURN_SHIPMENTS_API_LIST':
        return this._receiveData(action.entities);

      case 'RETURN_SHIPMENTS_API_SEARCH_RESULTS':
        return this._receiveData(action.results);

      default:

    }
  },

  getByOrgId(orgId) {
    return this.getAll().filter(returnShipment => returnShipment.get('organization_id') === orgId);
  }
});

ReturnShipmentStore._register(Dispatcher);

export default ReturnShipmentStore;
