import Immutable from 'immutable';
import { expect } from 'chai';

import Shipment from 'main/models/Shipment/Shipment';

const make = obj => new Shipment(Immutable.fromJS(obj));

describe('ShipmentModel', () => {
  it('#status', () => {
    const s = make({ status: 'pending' });
    expect(s.status()).to.equal('pending');
  });

  it('cant be deleted after check in', () => {
    const s = make({ checked_in_at: Date.now() });
    expect(s.isDeletable()).to.be.false;
  });

  it('stores the raw data', () => {
    const raw = Immutable.fromJS({ id: 's1asdf', status: 'accepted' });
    const model = new Shipment(raw);
    expect(raw === model.fullShipment()).to.be.true;
  });
});
