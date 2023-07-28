import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';
import LabStore from 'main/stores/LabStore';
import sinon from 'sinon';
import Immutable from 'immutable';
import SessionStore from 'main/stores/SessionStore';
import FeatureStore from 'main/stores/FeatureStore';
import ImplementationShipmentsPage from './ImplementationShipmentsPage';

describe('ImplementationShipmentsPage', () => {
  const sandbox = sinon.createSandbox();
  let wrapper;

  beforeEach(() => {
    sandbox.stub(LabStore, 'getByIds').returns(Immutable.fromJS([{ id: '1', name: 'lab' }]));
    sandbox.stub(FeatureStore, 'getLabIdsWithFeatures').returns(Immutable.fromJS({}));
  });

  afterEach(() => {
    if (wrapper) wrapper.unmount();
    if (sandbox) sandbox.restore();
  });

  it('should render empty', () => {
    shallow(<ImplementationShipmentsPage />);
  });

  it('should render implementation checkin modal and creator', () => {
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.fromJS({ id: 'orgid' }));
    wrapper = shallow(<ImplementationShipmentsPage />).dive();
    expect(wrapper.find('ConnectedImplementationCheckinModal').length).to.equal(1);
    expect(wrapper.find('ImplementationShipmentCreator').length).to.equal(1);
  });

  it('should update package prop when updatePackage is called', () => {
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.fromJS({ id: 'orgid' }));
    wrapper = shallow(<ImplementationShipmentsPage />).dive();
    wrapper.find('ImplementationShipmentCreator').props().updatePackage('name', 'shipment name');
    wrapper.update();
    expect(wrapper.find('ImplementationShipmentCreator').props().package.name).to.equals('shipment name');
  });

  it('should have default package on creating a shipment', () => {
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.fromJS({ id: 'orgid' }));
    wrapper = shallow(<ImplementationShipmentsPage />).dive();
    wrapper.find('ImplementationShipmentCreator').props().updatePackage('title', 'shipment name');
    wrapper.update();
    expect(wrapper.find('ImplementationShipmentCreator').props().package.title).to.equals('shipment name');
    wrapper.find('ImplementationShipmentCreator').props().onSave();
    wrapper.update();
    expect(wrapper.find('ImplementationShipmentCreator').props().package.title).to.equals('');
  });

});
