import Immutable from 'immutable';

import Dispatcher from 'main/dispatcher';
import rootNode from 'main/state/rootNode';
import { ShipmentStore } from 'main/stores/ShipmentStore';
import ContainerStore from 'main/stores/ContainerStore';

const pageData = rootNode.sub('shipmentCheckin');

const ShipmentCheckinStore = {
  selectedShipmentId:    pageData.sub('selectedShipmentId', undefined),
  selectedContainerId:   pageData.sub('selectedContainerId', undefined),
  locationSearchResults: pageData.sub('locationSearchResults', undefined),
  selectedLocation:      pageData.sub('selectedLocation', undefined),
  selectedBoxPosition:   pageData.sub('selectedBoxPosition', undefined),

  act(action) {
    switch (action.type) {
      case 'SHIPMENT_CHECKIN_SELECT_SHIPMENT':
        return this.selectedShipmentId.set(action.id);

      case 'SHIPMENT_CHECKIN_SELECT_CONTAINER':
        return this.selectedContainerId.set(action.id);
      default:
        return undefined;
    }
  },

  selectedShipment() {
    return ShipmentStore.shipmentModelForId(this.selectedShipmentId.get());
  },

  selectedContainer() {
    const id       = this.selectedContainerId.get();
    const shipment = this.selectedShipment();
    if ((!id) || (!shipment)) {
      return undefined;
    }
    return ContainerStore.getById(id);
  },

  shipmentContainers() {
    const shipment = this.selectedShipment();
    if (shipment) {
      return ContainerStore.getByIds(shipment.containerIds());
    }
    return Immutable.List();
  }
};

Dispatcher.register(ShipmentCheckinStore.act.bind(ShipmentCheckinStore));

export default ShipmentCheckinStore;
