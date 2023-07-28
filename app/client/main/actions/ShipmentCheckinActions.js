import Dispatcher from 'main/dispatcher';

const ShipmentCheckinActions = {
  selectShipment(id) {
    return Dispatcher.dispatch({ type: 'SHIPMENT_CHECKIN_SELECT_SHIPMENT', id });
  },

  selectContainer(id) {
    return Dispatcher.dispatch({ type: 'SHIPMENT_CHECKIN_SELECT_CONTAINER', id });
  }
};

export default ShipmentCheckinActions;
