import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import Immutable from 'immutable';
import sinon from 'sinon';

import { Button } from '@transcriptic/amino';
import InboundShipmentSuccessModal from 'main/pages/ShipmentsPage/components/InboundShipmentSuccessModal';
import ShipmentActions from 'main/actions/ShipmentActions';
import RunRef from './RunRef';

const containerType = Immutable.Map({ col_count: 2 });

const shipment = Immutable.fromJS({
  id: 'sr1dmz8ka2d7yf6',
  type: 'shipments',
  attributes: {
    checked_in_at: null,
    contact_name: null,
    contact_number: null,
    container_transfer_id: null,
    created_at: '2019-10-04T11:02:13.644-07:00',
    data: { },
    editable: true,
    label: 'FMCP',
    name: null,
    note: null,
    organization_id: 'org13',
    pickup_street: null,
    pickup_zipcode: null,
    receiving_note: null,
    scheduled_pickup: null,
    shipment_type: 'sample',
    shipped_at: null,
    lab_id: 'lb1fknzm4kjxcvg',
    updated_at: '2021-04-07T08:02:21.044-07:00',
    container_ids: [
      'ct1et8cdx6bnmwr'
    ],
    organization: {
      id: 'org13',
      name: 'Strateos'
    }
  }
});

const container = Immutable.Map({
  aliquot_count: 2,
  barcode: undefined,
  container_type_id: '96-pcr',
  id: 'ct1et8cdx6bnmwr',
  label: 'pcr test',
  organization_id: 'org13',
  status: 'inbound',
  storage_condition: 'cold_4',
  test_mode: true,
  type: 'containers'
});

const aliquots = Immutable.List([
  Immutable.fromJS({
    container_id: 'ct1et8cdx6bnmwr',
    id: 'aq1et8cdx7t3j52',
    name: 'A1',
    type: 'aliquots',
    volume_ul: '131.0',
    mass_mg: '50',
    well_idx: 0,
    resource_id: 'rs16pc8krr6ag7'
  }),
  Immutable.fromJS({
    container_id: 'ct1et8cdx6bnmwr',
    id: 'aq1et8cdx7t3j53',
    name: 'A2',
    type: 'aliquots',
    volume_ul: '131.0',
    mass_mg: undefined,
    well_idx: 1
  })
]);

describe('RunRef', () => {
  const sandbox = sinon.createSandbox();
  let wrapper;

  afterEach(() => {
    if (wrapper) wrapper.unmount();
    if (sandbox) sandbox.restore();
  });

  it('should show View Shipment link button', () => {
    const shipmentActions = sandbox.stub(ShipmentActions, 'loadContainers')
      .returns({ done: () => Immutable.fromJS({}) });

    wrapper = shallow(
      <RunRef
        run={Immutable.Map({})}
        runRef={Immutable.Map({})}
        container={container}
        containerType={containerType}
        shipment={shipment}
        aliquots={aliquots}
      />
    );

    const shipmentLinkButton = wrapper.find(Button);
    expect(shipmentLinkButton.length).to.equal(1);
    shipmentLinkButton.simulate('click');
    expect(shipmentActions.calledOnce).to.be.true;
    const shipmentModal = wrapper.find(InboundShipmentSuccessModal);
    expect(shipmentModal.props().modalId).to.equal(
      `${InboundShipmentSuccessModal.MODAL_ID}_${shipment.get('id')}`);
  });

});
