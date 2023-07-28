import React from 'react';
import { expect } from 'chai';
import { shallow, mount } from 'enzyme';
import Imm from 'immutable';
import sinon from 'sinon';
import { BrowserRouter as Router } from 'react-router-dom';
import Urls from 'main/util/urls';
import AcsControls from 'main/util/AcsControls';
import LabStore from 'main/stores/LabStore';
import FeatureConstants from '@strateos/features';
import SessionStore from 'main/stores/SessionStore';
import UserPreference from 'main/util/UserPreferenceUtil';
import FeatureStore from 'main/stores/FeatureStore';

import MaterialsPage from './MaterialsPage';
import VendorsTab from './VendorsTab';
import MaterialOrdersPage from './MaterialOrdersPage';

const props = {
  match: {
    path: '/strateos/vendor/materials'
  },
  history: {}
};

describe('Vendors Layout Page', () => {
  let vendorsLayout;
  const sandbox = sinon.createSandbox();

  beforeEach(() => {
    sandbox.stub(SessionStore, 'getOrg').returns(Imm.Map({ id: 'org13' }));
    sandbox.stub(UserPreference, 'get');
    sandbox.stub(UserPreference, 'save');
    sandbox.stub(FeatureStore, 'getLabIdsWithFeatures').returns(Imm.fromJS({}));
    sandbox.stub(LabStore, 'getByIds').returns(Imm.fromJS([{ id: '1', name: 'lab' }]));
    const getACS = sandbox.stub(AcsControls, 'isFeatureEnabled');
    getACS.withArgs(FeatureConstants.KIT_MGMT).returns(true);
    getACS.withArgs(FeatureConstants.MANAGE_KITS_VENDORS_RESOURCES).returns(true);
    getACS.withArgs(FeatureConstants.MANAGE_KIT_ORDERS).returns(true);
    Urls.use('strateos');
  });

  afterEach(() => {
    sandbox.restore();
    if (vendorsLayout) vendorsLayout.unmount();
  });

  it('should have tab router', () => {
    vendorsLayout = shallow(<VendorsTab />);
    const TabRouter = vendorsLayout.find('TabRouter');
    expect(TabRouter.length).to.equal(1);
  });

  it('should have materials subtab as default', () => {
    vendorsLayout = shallow(<VendorsTab />);
    const TabRouter = vendorsLayout.find('TabRouter');
    expect(TabRouter.prop('defaultTabId')).to.be.eql('resources');
  });

  it('should have 5 Tabs', () => {
    vendorsLayout = mount(<Router><VendorsTab {...props} /></Router>);

    const tabs = vendorsLayout.find('li').map(tab => tab.text());
    expect(tabs.length).to.eql(5);

    expect(tabs[0]).to.eql('Orders');
    expect(tabs[1]).to.eql('Materials');
    expect(tabs[2]).to.eql('Resources');
    expect(tabs[3]).to.eql('Vendors');
    expect(tabs[4]).to.eql('Suppliers');
  });

  it('should show Materials page when Materials tab is clicked', () => {
    const propsMaterials = {
      match: {
        path: '/strateos/vendor/materials'
      }
    };
    const historyProp = { push: 'history push function' };
    vendorsLayout = mount(<Router><VendorsTab {...propsMaterials} history={historyProp} /></Router>);

    expect(vendorsLayout.find(MaterialsPage)).to.have.lengthOf(1);
    expect(vendorsLayout.find(MaterialsPage).prop('history')).to.be.eql(historyProp);
  });

  it('should show Orders page when Orders tab is clicked', () => {
    const propsMaterials = {
      match: {
        path: '/strateos/vendor/orders'
      }
    };
    const historyProp = { push: 'history push function' };

    vendorsLayout = mount(<Router><VendorsTab {...propsMaterials} history={historyProp} /></Router>);
    expect(vendorsLayout.find(MaterialOrdersPage)).to.have.lengthOf(1);
    expect(vendorsLayout.find(MaterialOrdersPage).prop('history')).to.be.eql(historyProp);
  });

  it('should show Resources page when Resources tab is clicked', () => {
    const props = {
      match: {
        path: '/strateos/vendor/resources'
      }
    };

    vendorsLayout = mount(<Router><VendorsTab {...props} /></Router>);
    expect(vendorsLayout.find('ResourcesPage')).to.have.lengthOf(1);
  });

  it('should show Vendors page when Vendors tab is clicked', () => {
    const props = {
      match: {
        path: '/strateos/vendor/vendors'
      }
    };

    vendorsLayout = mount(<Router><VendorsTab {...props} /></Router>);
    expect(vendorsLayout.find('VendorPage')).to.have.lengthOf(1);
  });

  it('should not have tabs, if acs permissions are not enabled', () => {
    sandbox.restore();
    sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.KIT_MGMT).returns(false);
    vendorsLayout = mount(<Router><VendorsTab {...props} /></Router>);

    const tabs = vendorsLayout.find('li').map(tab => tab.text());
    expect(tabs.length).to.eql(0);
  });

  it('should show Suppliers page when Suppliers tab is clicked', () => {
    const props = {
      match: {
        path: '/strateos/vendor/suppliers'
      }
    };

    vendorsLayout = mount(<Router><VendorsTab {...props} /></Router>);
    expect(vendorsLayout.find('SupplierPage')).to.have.lengthOf(1);
  });

  it('should have 0 Tabs, if acs permissions are not enabled for resources', () => {
    sandbox.restore();
    const getACS = sandbox.stub(AcsControls, 'isFeatureEnabled');
    getACS.withArgs(FeatureConstants.KIT_MGMT).returns(true);
    getACS.withArgs(FeatureConstants.MANAGE_KITS_VENDORS_RESOURCES).returns(false);
    getACS.withArgs(FeatureConstants.MANAGE_KIT_ORDERS).returns(false);
    vendorsLayout = mount(<Router><VendorsTab {...props} /></Router>);
    const tabs = vendorsLayout.find('li').map(tab => tab.text());
    expect(tabs.length).to.eql(0);
  });
});
