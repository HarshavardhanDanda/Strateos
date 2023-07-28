import React         from 'react';
import { expect }    from 'chai';
import { shallow }   from 'enzyme';
import sinon from 'sinon';
import FeatureStore from 'main/stores/FeatureStore';
import FeatureConstants from '@strateos/features';

import CustomersPage, { Tabs } from './index';

describe('Customers Page Test', () => {

  let customersPage;
  const sandbox = sinon.createSandbox();

  const props = {
    match: {
      path: ''
    }
  };

  afterEach(() => {
    customersPage.unmount();
    if (sandbox) sandbox.restore();
  });

  it('customers page should have TabRouter component', () => {
    customersPage = shallow(<CustomersPage {...props} />);
    expect(customersPage.find('TabRouter').length).to.be.eql(1);
  });

  it('should render organizations tab only if manage orgs global permission is allowed', () => {
    sandbox.stub(FeatureStore, 'hasPlatformFeature').withArgs(FeatureConstants.MANAGE_ORGS_GLOBAL).returns(true);
    customersPage = shallow(<Tabs />);
    expect(customersPage.find('Subtabs').dive().find('NavLink').length).to.be.eql(1);
    expect(customersPage.find('Subtabs').dive().find('NavLink').at(0)
      .children()
      .text()).to.be.eql('Organizations');
  });

  it('should render users tab only if view users global permission is true', () => {
    sandbox.stub(FeatureStore, 'hasPlatformFeature').withArgs(FeatureConstants.VIEW_USERS_GLOBAL).returns(true);
    customersPage = shallow(<Tabs />);
    expect(customersPage.find('Subtabs').dive().find('NavLink').length).to.be.eql(1);
    expect(customersPage.find('Subtabs').dive().find('NavLink').at(0)
      .children()
      .text()).to.be.eql('Users');
  });

  it('should not render any tab if permission is not present', () => {
    customersPage = shallow(<Tabs />);
    expect(customersPage.find('Subtabs').dive().find('NavLink').length).to.equal(0);
  });
});
