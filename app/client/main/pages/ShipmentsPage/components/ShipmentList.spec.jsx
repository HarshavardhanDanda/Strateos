import React from 'react';
import { mount } from 'enzyme';
import { expect } from 'chai';
import sinon from 'sinon';
import Immutable from 'immutable';
import FeatureStore from 'main/stores/FeatureStore';
import FeatureConstants from '@strateos/features';
import ShipmentList from './ShipmentList';

describe('ShipmentsPage', () => {
  const sandbox = sinon.createSandbox();
  let shipmentList;
  const intakeKits = Immutable.fromJS([{
    id: 'ik1234',
    created_at: '2020-02-19T16:43:04.496-08:00',
    est_delivery_date: '2020-04-10',
    name: 'Intake Kit 7',
    organization_id: 'org1amxh23ednpz',
    received_at: null,
    status: 'pre_transit',
    status_message: 'Shipment information sent to FedEx',
    status_update_time: '2020-04-06T17:41:22.000-07:00',
    tracking_number: '391680980330',
    user_id: 'u1bfbgrzwe8fb',
    lab_id: 'lb1fgjqybducu2k',
    admin_processed_at: null,
    intake_kit_items: [
      {
        id: 325,
        intake_kit_id: 'ik1e5a2yhpwfewp',
        container_type_id: '96-pcr',
        quantity: 5
      },
      {
        id: 326,
        intake_kit_id: 'ik1e5a2yhpwfewp',
        container_type_id: 'micro-1.5',
        quantity: 1
      }
    ],
    items_count: 6
  }]);

  const props = {
    intakeKits: intakeKits,
    shipments: Immutable.fromJS([
      {
        id: 'sh12',
        name: 'shipment'
      }
    ]),
    onNavigateToContainer: () => {},
  };

  beforeEach(() => {
    sandbox.stub(FeatureStore, 'hasFeature').withArgs(FeatureConstants.VIEW_INTAKEKIT_SHIPMENTS).returns(true);
  });

  afterEach(() => {
    sandbox.restore();
    if (shipmentList) shipmentList.unmount();
  });

  it('should trigger scrollToInTransitToYouSection in componentDidMount', () => {
    const scrollIntoView = sandbox.stub(ShipmentList.prototype, 'scrollToInTransitToYouSection');
    shipmentList = mount(<ShipmentList {...props} inTransitToYou />);
    expect(shipmentList.instance().node.current).not.null;
    expect(scrollIntoView.calledOnce).to.true;
  });

  it('should not trigger scrollToInTransitToYouSection in componentDidMount', () => {
    const scrollIntoView = sandbox.stub(ShipmentList.prototype, 'scrollToInTransitToYouSection');
    shipmentList = mount(<ShipmentList {...props} inTransitToYou={false} />);
    expect(shipmentList.instance().node.current).not.null;
    expect(scrollIntoView.calledOnce).to.false;
  });
});
