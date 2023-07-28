import React from 'react';
import { expect } from 'chai';
import Immutable from 'immutable';
import { shallow } from 'enzyme';
import sinon from 'sinon';

import ShipmentsCheckin from 'main/pages/ShipmentsCheckin/ShipmentsCheckin';
import FeatureStore from 'main/stores/FeatureStore';
import ShipmentCheckinActions from 'main/actions/ShipmentCheckinActions';
import { ShipmentsCheckinPage } from './index';
import { checkinShipmentPageActions } from './checkinShipmentActions';

describe('ShipmentsCheckin', () => {
  const sandbox = sinon.createSandbox();
  const props = {
    searchOptions: {
      checked_in: 'pending,complete',
      page: 1
    },
    lab_ids: [
      'lb1fsv66repe9nc',
      'lb1fsv66rec7gg3'
    ],
    match: {
      path: '/:subdomain/lab_shipments/check_in',
      url: '/transcriptic/lab_shipments/check_in',
      isExact: true,
      params: {
        subdomain: 'transcriptic'
      }
    },
    location: {
      pathname: '/transcriptic/lab_shipments/check_in',
      hash: '',
      key: 'b4s7wk'
    },
    history: {
      length: 25,
      action: 'POP',
      location: {
        pathname: '/transcriptic/lab_shipments/check_in',
        hash: '',
        key: 'b4s7wk'
      }
    }
  };
  afterEach(() => {
    sandbox.restore();
  });

  it('should render Shipments Checkin page', () => {
    const search = Immutable.fromJS({ results: [] });
    sandbox.stub(FeatureStore, 'getLabIds').returns([]);
    const wrapper = shallow(<ShipmentsCheckinPage search={search} {...props} />);

    expect(wrapper.find(ShipmentsCheckin)).to.have.lengthOf(1);
  });

  it('should call functions on unmount', () => {
    const search = Immutable.fromJS({ results: [] });
    sandbox.stub(FeatureStore, 'getLabIds').returns([]);
    const selectShipment = sandbox.stub(ShipmentCheckinActions, 'selectShipment');
    const resetState = sandbox.stub(checkinShipmentPageActions, 'resetState');
    const wrapper = shallow(<ShipmentsCheckinPage search={search} {...props} />);
    wrapper.unmount();

    expect(selectShipment.calledWithExactly(undefined)).to.be.true;
    expect(resetState.calledOnce).to.be.true;
  });
});
