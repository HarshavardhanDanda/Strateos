import { expect } from 'chai';
import _ from 'lodash';

import { ShipmentStore } from './ShipmentStore';

function mockShipment(n) {
  return { id: `${n}`, created_at: `${n}` };
}

describe('ShipmentStore', () => {
  it('should check for pending shipments', () => {
    ShipmentStore._receiveData([mockShipment(0), mockShipment(1), mockShipment(2)]);

    expect(ShipmentStore.hasPendingShipments()).to.be.true;
  });

  it('should get checked in shipments', () => {
    const shipment = mockShipment(0);
    ShipmentStore._receiveData([{ ...shipment, checked_in_at: '0' }, mockShipment(1)]);

    expect(ShipmentStore.checkedInShipments().size).to.be.equal(1);
  });

  it('should get implementation shipments', () => {
    const shipment = mockShipment(0);
    ShipmentStore._receiveData([{ ...shipment, shipment_type: 'implementation' }]);

    expect(ShipmentStore.implementationShipments().size).to.be.greaterThan(0);
  });
});
