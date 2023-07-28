/* eslint-disable consistent-return, no-underscore-dangle, camelcase */
import _ from 'lodash';

import Dispatcher from 'main/dispatcher';
import CRUDStore from 'main/util/CRUDStore';
import ImmutableUtil from 'main/util/ImmutableUtil';

import ShipmentModel from 'main/models/Shipment';

const ShipmentStore = _.extend({}, CRUDStore('shipments'), {
  // Apply the filter method to filter shipments. If not provided, return all shipments
  shipmentModels(filter) {
    return this.getAll()
      .filter(filter || (() => true))
      .sort(ImmutableUtil.stringSorter('created_at', false))
      .map(s => new ShipmentModel(s));
  },

  pendingShipments() {
    return this.shipmentModels(shipment => !shipment.get('checked_in_at'));
  },

  hasPendingShipments() {
    const pendingShipments = this.pendingShipments();

    return pendingShipments.size > 0;
  },

  implementationShipments() {
    return this.shipmentModels(shipment => shipment.get('shipment_type') === 'implementation');
  },

  checkedInShipments() {
    return this.shipmentModels(shipment => shipment.get('checked_in_at'));
  },

  shipmentModelForId(id) {
    // TODO: Have CRUDStore _objects.get not have a default value
    if (this.has(id)) { return new ShipmentModel(this.getById(id)); }
  },

  _convertContainersToIds(shipment) {
    if (shipment.container_ids) {
      return _.omit(shipment, 'containers');
    }
    // eslint-disable-next-line no-param-reassign
    shipment.container_ids = shipment.containers && shipment.containers.map(c => c.id);
    return _.omit(shipment, 'containers');
  },

  destroyShipments(ids) {
    ids.forEach(id => {
      this._remove(id);
    });
  },

  empty() {
    return this._empty();
  },

  act(action) {
    switch (action.type) {
      case 'SHIPMENT_LIST':
        return this._receiveData(action.shipments.map(this._convertContainersToIds));

      case 'SHIPMENT_DATA':
        return this._receiveData([action.shipment].map(this._convertContainersToIds));

      case 'SHIPMENT_DESTROYED':
        return this._remove(action.id);

      case 'CONTAINERS_WITH_SHIPMENT':
        return this._receiveData([action.shipment].map(this._convertContainersToIds));

      case 'SHIPMENTS_API_LIST':
        return this._receiveData(action.entities.map(this._convertContainersToIds));
      default:
        break;
    }
  },

  getByOrgId(orgId) {
    return this.getAll().filter(shipment => shipment.get('organization_id') === orgId);
  }
}
);

ShipmentStore._register(Dispatcher);

export { ShipmentModel, ShipmentStore };
