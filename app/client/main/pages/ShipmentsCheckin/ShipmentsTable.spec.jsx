import React from 'react';
import { shallow, mount } from 'enzyme';
import { expect } from 'chai';
import Immutable from 'immutable';
import { Select, Table, Button, List, TopFilterBar } from '@transcriptic/amino';
import Moment from 'moment';
import sinon from 'sinon';
import ShipmentActions from 'main/actions/ShipmentActions';

import ShipmentModel from 'main/models/Shipment';

import FeatureStore from 'main/stores/FeatureStore';
import ShipmentsTable from './ShipmentsTable';

describe('ShipmentsTable', () => {
  const sandbox = sinon.createSandbox();
  const shipment = new ShipmentModel(
    Immutable.fromJS(
      {
        id: '6',
        shipment_type: 'sample',
        checkedInAt: Moment(new Date()).format('MMM D, YYYY'),
        remaining: 0,
        organization: { name: 'foo' },
        labName: 'lab',
        created_at: Moment(new Date()).format('MMM D, YYYY'),
        label: 'bar'
      }
    )
  );

  beforeEach(() => {
    sandbox.stub(FeatureStore, 'getLabIdsWithFeatures').returns(Immutable.fromJS(['lab1']));
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('renders a table', () => {
    const wrapper = shallow(
      <ShipmentsTable
        shipments={Immutable.fromJS([shipment])}
        shipmentToContainers={Immutable.Map({ 6: Immutable.Iterable() })}
      />
    );
    expect(wrapper.find(List)).to.have.lengthOf(1);

  });

  it('renders 2 dropdowns', () => {
    const wrapper = shallow(
      <ShipmentsTable
        shipments={Immutable.fromJS([shipment])}
        shipmentToContainers={Immutable.Map({ 6: Immutable.Iterable() })}
      />
    );
    expect(wrapper.find(Select)).to.have.lengthOf(2);
  });

  it('renders a button', () => {
    const wrapper = shallow(
      <ShipmentsTable
        shipments={Immutable.fromJS([shipment])}
        shipmentToContainers={Immutable.Map({ 6: Immutable.Iterable() })}
      />
    );
    expect(wrapper.find(List).props().actions).to.have.lengthOf(1);
  });

  it('renders with a single button in table', () =>  {
    const fullWrapper = mount(
      <ShipmentsTable
        shipments={Immutable.fromJS([shipment])}
        shipmentToContainers={Immutable.Map({ 6: Immutable.Iterable() })}
      />
    );
    expect(fullWrapper.find(Table).at(0).find(Button)).to.have.lengthOf(1);
  });

  it('table should have Lab column', () => {
    const wrapper = shallow(
      <ShipmentsTable
        shipments={Immutable.fromJS([shipment])}
        shipmentToContainers={Immutable.Map({ 6: Immutable.Iterable() })}
      />
    );
    expect(wrapper.find(List).dive().find(Table).dive()
      .find('HeaderCell')
      .at(3)
      .dive()
      .text()).to.equal('Lab');
  });

  it('Organization filter should be disabled for CCS organization', () => {
    const wrapper = shallow(
      <ShipmentsTable
        shipments={Immutable.fromJS([shipment])}
        shipmentToContainers={Immutable.Map({ 6: Immutable.Iterable() })}
        showOrgFilter={false}
      />
    );
    expect(wrapper.find('OrganizationTypeAhead').length).to.equal(0);
  });

  it('Should render Organization filter for non CCS Org', () => {
    const wrapper = shallow(
      <ShipmentsTable
        shipments={Immutable.fromJS([shipment])}
        shipmentToContainers={Immutable.Map({ 6: Immutable.Iterable() })}
        showOrgFilter
      />
    );
    expect(wrapper.find('OrganizationTypeAhead').length).to.equal(1);
  });

  it('Should update the value on filter after selecting option on status and shipment type ', () => {
    const onSelectFilter = sinon.spy();
    const wrapper = shallow(
      <ShipmentsTable
        shipments={Immutable.fromJS([shipment])}
        shipmentToContainers={Immutable.Map({ 6: Immutable.Iterable() })}
        showOrgFilter
        onSelectFilter={onSelectFilter}
      />
    );
    wrapper.find(TopFilterBar).find('Select').at(0).simulate('change', {
      target: { value: 'pending'  }
    });
    expect(wrapper.state().checkInStatus).to.equals('pending');

    wrapper.find(TopFilterBar).find('Select').at(1).simulate('change', {
      target: { value: 'implementation'  }
    });
    expect(wrapper.state().shipmentType).to.equals('implementation');

    wrapper.find(TopFilterBar).find('Select').at(1).simulate('change', {
      target: { value: 'implementation,sample'  }
    });
    expect(wrapper.state().shipmentType).to.equals('implementation,sample');
  });

  it('Should call destroy many api when user clicks on single destroy button on list', () => {
    const wrapper = shallow(
      <ShipmentsTable
        shipments={Immutable.fromJS([shipment])}
        shipmentToContainers={Immutable.Map({ 6: Immutable.Iterable() })}
      />
    );
    global.confirm = () => true;
    const shipmentDestroyManyApiSpy = sandbox.spy(ShipmentActions, 'destroyMany');
    wrapper.find(List).dive().find('Table').dive()
      .find('CheckinActions')
      .dive()
      .find('Button')
      .simulate('click', { stopPropagation: () => undefined });
    expect(shipmentDestroyManyApiSpy.calledOnce).to.be.true;
    expect(shipmentDestroyManyApiSpy.args[0][0][0]).to.equal(shipment.id());
  });
});
