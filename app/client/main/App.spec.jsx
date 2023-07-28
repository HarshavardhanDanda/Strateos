import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { expect } from 'chai';
import { mount, shallow } from 'enzyme';
import sinon from 'sinon';
import { SubMenu, Subtabs } from '@transcriptic/amino';
import Immutable from 'immutable';

import UserNavBar from 'main/components/UserNavBar';
import DrawerStore from 'main/stores/DrawerStore';
import FeatureStore from 'main/stores/FeatureStore';
import SessionStore from 'main/stores/SessionStore';
import AcsControls from 'main/util/AcsControls';
import FeatureConstants from '@strateos/features';
import Toaster from 'main/components/Toaster';
import ShippingCart from 'main/inventory/components/ShippingCart';
import InventorySelectorModal from 'main/inventory/InventorySelector/InventorySelectorModal';
import App from './App';

describe('App', () => {
  let wrapper;
  const sandbox = sinon.createSandbox();
  let getOrgStub;

  const user = {
    id: 'u18dcbwhctbnj',
    name: 'john doe',
    email: 'jdoe@transcriptic.com',
    lastSignInIp: '0.0.0.0',
    createdAt: '2020-05-27T09:16:16.522-07:00'
  };

  beforeEach(() => {
    sandbox.stub(DrawerStore, 'isOpen').returns(false);
    sandbox.stub(FeatureStore, 'hasApp').returns(true);
    sandbox.stub(DrawerStore, 'getHeight').returns(0);
    sandbox.stub(SessionStore, 'getUser').returns(Immutable.fromJS(user));
    sandbox.stub(SessionStore, 'isMasquerading').returns(false);
    getOrgStub = sandbox.stub(SessionStore, 'getOrg').returns(Immutable.fromJS({ id: 'org13', subdomain: 'transcriptic', feature_groups: [] }));
  });

  afterEach(() => {
    wrapper.unmount();
    sandbox.restore();
  });

  const resizeWindow = (width) => {
    window.innerWidth = width;
    window.dispatchEvent(new Event('resize'));
  };

  it('should render App', () => {
    wrapper = shallow(<Router><App /></Router>);
    expect(wrapper.find(App).length).to.equal(1);
  });

  it('should render top nav bar', () => {
    wrapper = mount(<Router><App /></Router>);
    expect(wrapper.find(UserNavBar).length).to.equal(1);
  });

  it('should render nav menu with Subtabs', () => {
    wrapper = mount(<Router><App /></Router>);
    expect(wrapper.find(Subtabs).length).to.equal(1);
  });

  it('should render SubMenu Title Text', () => {
    wrapper = mount(<Router><App /></Router>);
    expect(wrapper.find(SubMenu).length).to.equal(1);
    expect(wrapper.find(SubMenu).props().defaultSubMenuText).to.equal('More');
  });

  it('should render navbar according to the window size', () => {
    wrapper = mount(<Router><App /></Router>);
    expect(wrapper.find('li').length).to.equal(5);
    resizeWindow(1241);
    wrapper.update();
    expect(wrapper.find('li').length).to.equal(7);
    resizeWindow(1239);
    wrapper.update();
    expect(wrapper.find('li').length).to.equal(5);
  });

  it('should render default subMenu text regardless of window size change', () => {
    sandbox.stub(AcsControls, 'isFeatureEnabled').callsFake((feature) => feature !== FeatureConstants.SUBMIT_INSTRUCTIONS_TO_EXECUTE);
    wrapper = mount(<Router><App /></Router>);
    window.history.pushState({}, '', '/projects');

    resizeWindow(1239);
    wrapper.update();

    expect(wrapper.find('li').length).to.equal(5);
    expect(wrapper.find('li').last().text()).to.equal('More');
    expect(wrapper.find('li').last().find('.submenu-link').length).to.equal(1);

    resizeWindow(1241);
    wrapper.update();
    expect(wrapper.find('li').length).to.equal(7);
    expect(wrapper.find('li').last().text()).to.equal('More');
    expect(wrapper.find('li').last().find('.submenu-link').length).to.equal(1);

    resizeWindow(1239);
    wrapper.update();
    expect(wrapper.find('li').length).to.equal(5);
    expect(wrapper.find('li').last().text()).to.equal('More');

    resizeWindow(1241);
    wrapper.update();
    expect(wrapper.find('li').length).to.equal(7);
    expect(wrapper.find('li').last().text()).to.equal('More');
  });

  it('should render swapped subMenu default text with the menu item before the threshold on window size change', () => {
    sandbox.stub(AcsControls, 'isFeatureEnabled').callsFake((feature) => feature !== FeatureConstants.SUBMIT_INSTRUCTIONS_TO_EXECUTE);
    wrapper = mount(<Router><App /></Router>);
    window.history.pushState({}, '', '/workflows');

    resizeWindow(1239);
    wrapper.update();
    expect(wrapper.find('li').length).to.equal(5);
    expect(wrapper.find('li').last().text()).to.equal('Workflow Builder');

    resizeWindow(1241);
    wrapper.update();
    expect(wrapper.find('li').last().text()).to.equal('More');
    expect(wrapper.find('li').length).to.equal(7);

    resizeWindow(1239);
    wrapper.update();
    expect(wrapper.find('li').length).to.equal(5);
    expect(wrapper.find('li').last().text()).to.equal('Workflow Builder');

    resizeWindow(1241);
    wrapper.update();
    expect(wrapper.find('li').length).to.equal(7);
    expect(wrapper.find('li').last().text()).to.equal('More');
  });

  it('should render matching subMenu text with current route path regardless of window size change', () => {
    sandbox.stub(AcsControls, 'isFeatureEnabled').callsFake((feature) => feature !== FeatureConstants.SUBMIT_INSTRUCTIONS_TO_EXECUTE);
    wrapper = mount(<Router><App /></Router>);
    window.history.pushState({}, '', '/devices');

    resizeWindow(1239);
    wrapper.update();
    expect(wrapper.find('li').length).to.equal(5);
    expect(wrapper.find('li').last().text()).to.equal('Devices');

    resizeWindow(1241);
    wrapper.update();
    expect(wrapper.find('li').last().text()).to.equal('Devices');
    expect(wrapper.find('li').length).to.equal(7);

    resizeWindow(1239);
    wrapper.update();
    expect(wrapper.find('li').length).to.equal(5);
    expect(wrapper.find('li').last().text()).to.equal('Devices');

    resizeWindow(1241);
    wrapper.update();
    expect(wrapper.find('li').length).to.equal(7);
    expect(wrapper.find('li').last().text()).to.equal('Devices');
  });

  it('should render billing tab if user has MANAGE_INVOICES_GLOBAL permission', () => {
    sandbox.stub(FeatureStore, 'hasPlatformFeature').withArgs(FeatureConstants.VIEW_INVOICES_GLOBAL).returns(true);
    wrapper = mount(<Router><App /></Router>);
    const submenuChildren = wrapper.find(SubMenu).props().children;
    expect(submenuChildren.filter(child => child.key === 'bills').length).to.equal(1);
  });

  it('should render billing tab if user has APPROVE_PURCHASE_ORDER permission', () => {
    sandbox.stub(FeatureStore, 'hasPlatformFeature').withArgs(FeatureConstants.APPROVE_PURCHASE_ORDER).returns(true);
    wrapper = mount(<Router><App /></Router>);
    const submenuChildren = wrapper.find(SubMenu).props().children;
    expect(submenuChildren.filter(child => child.key === 'bills').length).to.equal(1);
  });

  it('should not render billing tab if user does not have any billing admin platform permission', () => {
    wrapper = mount(<Router><App /></Router>);
    const submenuChildren = wrapper.find(SubMenu).props().children;
    expect(submenuChildren.filter(child => child.key === 'bills').length).to.equal(0);
  });

  it('should render customers tab if user has MANAGE_ORGS_GLOBAL permission', () => {
    sandbox.stub(FeatureStore, 'hasPlatformFeature').withArgs(FeatureConstants.MANAGE_ORGS_GLOBAL).returns(true);
    wrapper = mount(<Router><App /></Router>);
    const submenuChildren = wrapper.find(SubMenu).props().children;
    expect(submenuChildren.filter(child => child.key === 'customers').length).to.equal(1);
  });

  it('should render documentation tab if user has DOCUMENTATION permission', () => {
    sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs('DOCUMENTATION').returns(true);
    wrapper = mount(<Router><App /></Router>);
    const anchorTag = wrapper.find(Subtabs).find('a');
    expect(anchorTag.text()).to.equal('Documentation');
    expect(anchorTag.props().href).to.equal('https://support.strateos.com/en/');
  });

  it('should not render documentation tab if user does not have DOCUMENTATION permission', () => {
    sandbox.stub(AcsControls, 'isFeatureEnabled').returns(false);
    sandbox.stub(FeatureStore, 'hasPlatformFeature').returns(false);
    wrapper = mount(<Router><App /></Router>);
    expect(wrapper.find(Subtabs).find('a').length).to.equal(0);
  });

  it('should render customers tab if user has VIEW_USERS_GLOBAL permission', () => {
    sandbox.stub(FeatureStore, 'hasPlatformFeature').withArgs(FeatureConstants.VIEW_USERS_GLOBAL).returns(true);
    wrapper = mount(<Router><App /></Router>);
    const submenuChildren = wrapper.find(SubMenu).props().children;
    expect(submenuChildren.filter(child => child.key === 'customers').length).to.equal(1);
  });

  it('should not render customers tab if user does not have any customer admin platform permission', () => {
    wrapper = mount(<Router><App /></Router>);
    const submenuChildren = wrapper.find(SubMenu).props().children;
    expect(submenuChildren.filter(child => child.key === 'customers').length).to.equal(0);
  });

  it('should contain Toaster', () => {
    wrapper = shallow(<Router><App /></Router>);
    expect(wrapper.dive().find(Toaster)).to.exist;
  });

  it('should contain ShippingCart', () => {
    wrapper = shallow(<Router><App /></Router>);
    expect(wrapper.dive().find(ShippingCart)).to.exist;
  });

  it('should contain InventorySelectorModal', () => {
    getOrgStub.restore();
    getOrgStub = sandbox.stub(SessionStore, 'getOrg').returns(Immutable.fromJS({ id: 'org13', subdomain: 'transcriptic', feature_groups: ['inventory_browser_microapp'] }));
    wrapper = shallow(<Router><App /></Router>);
    expect(wrapper.dive().find(InventorySelectorModal)).to.exist;
  });
});
