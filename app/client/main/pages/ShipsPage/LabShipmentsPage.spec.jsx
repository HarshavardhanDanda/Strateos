import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import sinon from 'sinon';

import AcsControls from 'main/util/AcsControls';
import FeatureConstants from '@strateos/features';
import LabShipmentsPage from 'main/pages/ShipsPage/LabShipmentsPage.jsx';

describe('Lab Shipment', () => {
  let wrapper;
  const sandbox = sinon.createSandbox();

  afterEach(() => {
    wrapper.unmount();
    sandbox.restore();
  });

  it('should render intake kit landing page', () => {
    const getACS = sandbox.stub(AcsControls, 'isFeatureEnabled');
    getACS.withArgs(FeatureConstants.INTAKE_KITS_SHIPMENTS).returns(true);
    wrapper = shallow(<LabShipmentsPage />);
    expect(wrapper.find('TabRouter').props().defaultTabId).eq('intake_kits');
  });

  it('should render impl landing page', () => {
    const getACS = sandbox.stub(AcsControls, 'isFeatureEnabled');
    getACS.withArgs(FeatureConstants.MANAGE_IMPLEMENTATION_SHIPMENTS).returns(true);
    wrapper = shallow(<LabShipmentsPage />);
    expect(wrapper.find('TabRouter').props().defaultTabId).eq('implementation');
  });

  it('should render checkin landing page', () => {
    const getACS = sandbox.stub(AcsControls, 'isFeatureEnabled');
    getACS.withArgs(FeatureConstants.CHECKIN_SAMPLE_SHIPMENTS).returns(true);
    wrapper = shallow(<LabShipmentsPage />);
    expect(wrapper.find('TabRouter').props().defaultTabId).eq('check_in');
  });

  it('should render return shipment landing page', () => {
    const getACS = sandbox.stub(AcsControls, 'isFeatureEnabled');
    getACS.withArgs(FeatureConstants.MANAGE_SAMPLE_RETURN_SHIPMENTS).returns(true);
    wrapper = shallow(<LabShipmentsPage />);
    expect(wrapper.find('TabRouter').props().defaultTabId).eq('return');
  });
});
