import _                from 'lodash';
import rootNode         from 'main/state/rootNode';

const checkinShipmentPageState   = rootNode.sub(['checkinShipmentStateStore']);

const checkinShipmentStateDefaults = {
  checked_in: 'pending,complete',
  organization_id: undefined,
  shipment_type: undefined,
  lab_id: undefined,
  page: 1,
  per_page: 12
};

checkinShipmentPageState.set(
  _.extend({}, checkinShipmentStateDefaults)
);

export { checkinShipmentPageState, checkinShipmentStateDefaults };
