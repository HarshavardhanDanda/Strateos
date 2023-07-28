import sinon from 'sinon';
import { expect } from 'chai';

import ShipmentAPI from 'main/api/ShipmentAPI';
import { checkinShipmentPageActions } from './checkinShipmentActions';
import { checkinShipmentStateDefaults } from './checkinShipmentState';

describe('checkinShipmentActions', () => {
  let shipmentAPIIndex;
  const sandbox = sinon.createSandbox();

  beforeEach(() => {
    shipmentAPIIndex = sandbox.stub(ShipmentAPI, 'index').returns({
      done: () => { },
      always: () => { },
      fail: () => { }
    });
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should do a search with default values', () => {
    const defaultOptions = checkinShipmentStateDefaults;
    checkinShipmentPageActions.doSearch(defaultOptions);

    expect(shipmentAPIIndex.args[0][0]).to.deep.equal({
      filters: {
        checked_in: 'pending,complete'
      },
      includes: [
        'containers',
        'containers.location'],
      limit: 12,
      page: 1,
    });
  });

  it('should reset state with non-undefined default values', () => {
    const stateStoreSet = sandbox.stub(checkinShipmentPageActions.stateStore, 'set');
    checkinShipmentPageActions.resetState();

    expect(stateStoreSet.args[0][0]).to.deep.equal({
      checked_in: 'pending,complete',
      per_page: 12,
      page: 1,
    });
  });
});
