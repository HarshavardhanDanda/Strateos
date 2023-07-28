import React from 'react';
import Immutable from 'immutable';
import Moment from 'moment';
import { expect } from 'chai';
import { shallow } from 'enzyme';

import ShipmentModel from 'main/models/Shipment/Shipment';
import ContainerBadge from './ContainerBadge';

const container = Immutable.Map({
  aliquot_count: 2,
  barcode: undefined,
  container_type_id: '96-pcr',
  id: 'ct1et8cdx6bnmwr',
  label: 'pcr test',
  organization_id: 'org13',
  status: 'inbound',
  storage_condition: 'cold_4',
  test_mode: false,
  type: 'containers',
  lab: { id: 'lb1', name: 'lab1' }
});
const containerType = Immutable.Map({
  col_count: 2
});
const shipment = new ShipmentModel(
  Immutable.fromJS({ id: '5', code: 'SHIP-12', label: 'SHIP-12', shipment_type: 'sample' })
);

describe('ContainerBadge', () => {
  let wrapper;

  afterEach(() => {
    wrapper.unmount();
  });

  it('should display status badge only by default', () => {
    wrapper = shallow(<ContainerBadge container={container} containerType={containerType} />);

    expect(wrapper.find('StatusPill').length).to.equal(1);
  });

  it('should display test badge', () => {
    const testContainer = container.set('test_mode', true);
    wrapper = shallow(<ContainerBadge container={testContainer} containerType={containerType} />);

    expect(wrapper.find('StatusPill').length).to.equal(2);
    expect(wrapper.find('StatusPill').at(0).props().text).to.equal('Test mode');
  });

  it('should display shipping cart badge', () => {
    wrapper = shallow(<ContainerBadge container={container} containerType={containerType} inShippingCart />);

    expect(wrapper.find('StatusPill').length).to.equal(2);
    expect(wrapper.find('StatusPill').at(0).props().text).to.equal('In shipping cart');
  });

  it('should display stock container badge', () => {
    const stockContainer = container.set('organization_id', undefined);
    wrapper = shallow(<ContainerBadge container={stockContainer} containerType={containerType} />);

    expect(wrapper.find('StatusPill').length).to.equal(2);
    expect(wrapper.find('StatusPill').at(0).props().text).to.equal('Stock container');
  });

  describe('status badge', () => {
    it('should display inbound status badge', () => {
      const inboundContainer = container.set('status', 'inbound');
      wrapper = shallow(<ContainerBadge container={inboundContainer} containerType={containerType} shipment={shipment} />);

      expect(wrapper.find('StatusPill').props().text).to.equal('Member of inbound shipment SHIP-12');
    });

    it('should display pending_destroy status badge', () => {
      const pendingDestroyContainer = container.set('status', 'pending_destroy');
      wrapper = shallow(<ContainerBadge container={pendingDestroyContainer} containerType={containerType} />);

      expect(wrapper.find('StatusPill').props().text).to.equal('Pending destruction');
    });

    it('should display destroyed status badge', () => {
      const destroyedContainer = container.set('status', 'destroyed');
      wrapper = shallow(<ContainerBadge container={destroyedContainer} containerType={containerType} />);

      expect(wrapper.find('StatusPill').props().text).to.equal('Destroyed');
    });

    it('should display pending_return status badge', () => {
      const pendingReturnContainer = container.set('status', 'pending_return');
      wrapper = shallow(<ContainerBadge container={pendingReturnContainer} containerType={containerType} />);

      expect(wrapper.find('StatusPill').props().text).to.equal('Preparing for return shipment');
    });

    it('should display returned status badge', () => {
      const shippedContainer = container.set('status', 'returned');
      wrapper = shallow(<ContainerBadge container={shippedContainer} containerType={containerType} />);

      expect(wrapper.find('StatusPill').props().text).to.equal('Shipped out');
    });

    it('should display destruction time badge', () => {
      const threeDaysAgo = Moment().subtract(3, 'days');
      const availableContainer = container.set('status', 'available');
      const staleContainer = container.set('willBeDestroyedAt', threeDaysAgo);
      wrapper = shallow(<ContainerBadge container={availableContainer} containerType={containerType} staleContainer={staleContainer} />);

      expect(wrapper.find('StatusPill').props().text).to.equal('Destruction imminent');
    });
  });
});
