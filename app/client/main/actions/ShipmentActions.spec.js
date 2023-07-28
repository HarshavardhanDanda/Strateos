import sinon from 'sinon';
import { expect } from 'chai';

import ajax from 'main/util/ajax';
import ShipmentActions from './ShipmentActions';

describe('Shipment Actions', () => {
  const sandbox = sinon.createSandbox();
  afterEach(() => {
    sandbox.restore();
  });

  const shipmentResponse = {
    data: {
      id: 'sr1gktc9gefpmdj',
      type: 'shipments',
      attributes: {
        checked_in_at: '2017-12-06 19:17:28.662482',
        data: {},
        editable: true,
        label: 'TNFU',
        organization_id: 'org13',
        container_ids: [
          'ct1gktc9fnvg9ms'
        ]
      }
    }
  };

  const shipmentContainers = [
    {
      id: 'ct1gktc9fnvg9ms',
      container_type_id: '96-pcr',
      shipment_code: 'HIT',
      status: 'inbound',
      organization_name: 'Strateos',
    }
  ];

  it('should successfully create shipment and load containers', () => {
    const post = sandbox.stub(ajax, 'post').returns({
      done: (cb) => {
        cb(shipmentResponse);
        return { fail: () => ({}) };
      }
    });
    const loadContainers = sandbox.stub(ShipmentActions, 'loadContainers').returns({
      done: (cb) => {
        cb(shipmentContainers);
        return { fail: () => ({}) };
      }
    });
    ShipmentActions.createShipmentWithCodes({});
    expect(post.calledWith('/api/shipments/create_shipment_with_codes')).to.be.true;
    expect(loadContainers.calledOnce).to.be.true;
  });

});
