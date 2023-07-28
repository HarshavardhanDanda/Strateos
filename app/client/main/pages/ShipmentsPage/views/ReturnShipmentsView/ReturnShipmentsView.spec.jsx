import React from 'react';
import { shallow } from 'enzyme';
import Sinon from 'sinon';
import { expect } from 'chai';
import Immutable from 'immutable';
import SessionStore from 'main/stores/SessionStore';
import ReturnShipmentsView from './ReturnShipmentsView';

describe('Return Shipment View', () => {
  let wrapper;
  const sandbox = Sinon.createSandbox();

  const props = {
    match: {
      isExact: true,
      params: {
        subdomain: 'transcriptic'
      }
    },
    returnShipments: []
  };

  beforeEach(() => {
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.Map({ id: 'org13' }));
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should have open sub tab as a default tab', () => {
    wrapper = shallow(<ReturnShipmentsView {...props} />);
    const TabRouter = wrapper.dive().find('TabRouter');
    expect(TabRouter.props().defaultTabId).to.equal('Open');
  });
});
