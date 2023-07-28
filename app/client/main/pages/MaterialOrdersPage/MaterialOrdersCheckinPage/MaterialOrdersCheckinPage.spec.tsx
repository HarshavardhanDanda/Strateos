import React from 'react';
import Immutable from 'immutable';
import { shallow } from 'enzyme';
import { expect } from 'chai';
import _ from 'lodash';
import sinon from 'sinon';
import SessionStore from 'main/stores/SessionStore';
import Urls from 'main/util/urls';
import MaterialOrdersCheckinPage from './MaterialOrdersCheckinPage';

describe('MaterialOrdersCheckinPage', () => {
  const sandbox = sinon.createSandbox();
  let wrapper;

  beforeEach(() => {
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.fromJS({ id: 'org13', subdomain: 'transcriptic' }));
  });

  afterEach(() => {
    sandbox.restore();
    wrapper.unmount();
  });

  const props = {
    location: {
      data: [
        Immutable.Map({ id: 'ko1' }),
        Immutable.Map({ id: 'ko2' }),
      ]
    }
  };

  it('should render page', () => {
    wrapper = shallow(<MaterialOrdersCheckinPage {...props} />);
    expect(wrapper.find('TextSubheading').props().children).to.equal('Check in');
  });

  it('should set MaterialOrdersCheckinForm props', () => {
    wrapper = shallow(<MaterialOrdersCheckinPage {...props} />);
    expect(wrapper.find('MaterialOrdersCheckinForm').props().data.length).to.equal(2);
  });

  it('should redirect to orders page if data prop does not exist', () => {
    const redirect = sandbox.spy();
    const propsWithoutOrders = { ...props, location: {}, history: { replace: redirect } };
    wrapper = shallow(<MaterialOrdersCheckinPage {...propsWithoutOrders} />);
    expect(redirect.calledOnce).to.be.true;
    expect(redirect.getCall(0).args[0].pathname).to.equal(Urls.material_orders_page());
  });

  it('should redirect to orders page upon successful bulk checkin', () => {
    const redirect = sandbox.spy();
    wrapper = shallow(<MaterialOrdersCheckinPage {...props} history={{ replace: redirect }} />);
    wrapper.find('MaterialOrdersCheckinForm').props().onBulkCheckinSuccess();
    expect(redirect.calledOnce).to.be.true;
    expect(redirect.getCall(0).args[0].pathname).to.equal(Urls.material_orders_page());
  });
});
