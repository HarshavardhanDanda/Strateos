import React from 'react';
import { mount } from 'enzyme';
import { expect } from 'chai';
import Immutable from 'immutable';
import sinon from 'sinon';
import { BrowserRouter as Router } from 'react-router-dom';
import { Button } from '@transcriptic/amino';

import Urls from 'main/util/urls';
import AcsControls from 'main/util/AcsControls';
import FeatureConstants from '@strateos/features';
import OrganizationStore from 'main/stores/OrganizationStore';
import SessionStore from 'main/stores/SessionStore';
import FeatureStore from 'main/stores/FeatureStore';
import ContainerStore from 'main/stores/ContainerStore';
import ConnectedInventoryPage from 'main/pages/InventoryPage/ConnectedInventoryPage';
import InventoryLayout from './InventoryLayout';

const props = {
  match: {
    params: {
      subdomain: 'transcriptic'
    },
    path: '/:subdomain/inventory/samples'
  },
  history: {}
};

describe('InventoryLayout', () => {
  const sandbox = sinon.createSandbox();
  let inventoryLayout;

  beforeEach(() => {
    sandbox.stub(ContainerStore, 'getAll').returns(Immutable.Map());
    sandbox.stub(FeatureStore, 'getLabIds').returns(Immutable.fromJS(['lab1', 'lab2']));
    sandbox.stub(OrganizationStore, 'findBySubdomain').withArgs('transcriptic').returns(Immutable.fromJS({ id: 'org13', container_stats: { total: 2 } }));

    Urls.use(props.match.params.subdomain);
  });

  afterEach(() => {
    if (inventoryLayout) inventoryLayout.unmount();
    sandbox.restore();
  });

  it('should have add container button in containers sub tab if permissions are given', () => {
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.fromJS({ id: 'org13', subdomain: 'transcriptic', feature_groups: [] }));
    const getACS = sandbox.stub(AcsControls, 'isFeatureEnabled');
    getACS.withArgs(FeatureConstants.CREATE_SAMPLE_SHIPMENTS).returns(true);
    getACS.withArgs(FeatureConstants.CREATE_TEST_CONTAINERS).returns(true);
    getACS.withArgs(FeatureConstants.TRANSFER_CONTAINER).returns(true);
    inventoryLayout = mount(<Router><InventoryLayout {...props}> <ConnectedInventoryPage /></InventoryLayout></Router>);
    const button = inventoryLayout.find(Button).filterWhere(button => button.text() === 'Add container');
    expect(button).to.have.lengthOf(1);
    expect(button.text()).to.equal('Add container');
  });

  it('should not have add container button in containers sub tab if permissions are not given', () => {
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.fromJS({ id: 'org13', subdomain: 'transcriptic', feature_groups: [] }));
    const getACS = sandbox.stub(AcsControls, 'isFeatureEnabled');
    getACS.withArgs(FeatureConstants.CREATE_SAMPLE_SHIPMENTS).returns(false);
    getACS.withArgs(FeatureConstants.CREATE_TEST_CONTAINERS).returns(false);
    getACS.withArgs(FeatureConstants.TRANSFER_CONTAINER).returns(true);
    inventoryLayout = mount(<Router><InventoryLayout {...props}> <ConnectedInventoryPage /></InventoryLayout></Router>);
    const button = inventoryLayout.find('Button');
    expect(button).to.have.lengthOf(0);
  });

  it('should have 2 Tabs, if acs permissions are enabled for containers', () => {
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.fromJS({ id: 'org13', subdomain: 'transcriptic', feature_groups: [] }));
    const getACS = sandbox.stub(AcsControls, 'isFeatureEnabled');
    getACS.withArgs(FeatureConstants.VIEW_SAMPLE_CONTAINERS).returns(true);
    getACS.withArgs(FeatureConstants.MANAGE_CONTAINERS_IN_LAB).returns(true);
    getACS.withArgs(FeatureConstants.TRANSFER_CONTAINER).returns(true);
    sandbox.stub(FeatureStore, 'hasFeature').withArgs(FeatureConstants.MANAGE_CONTAINER_LOCATIONS).returns(true);

    inventoryLayout = mount(<Router><InventoryLayout {...props} /></Router>);
    const tabs = inventoryLayout.find('li').map(tab => tab.text());
    expect(tabs.length).to.eql(2);
    expect(tabs[0]).to.eql('Locations');
    expect(tabs[1]).to.eql('Containers');

    const connectedInventoryPage = inventoryLayout.find('ConnectedInventoryPage');
    expect(connectedInventoryPage.prop('history')).to.deep.equal({});
  });

  it('should have 1 Tab, if acs permissions are not enabled for containers', () => {
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.fromJS({ id: 'org13', subdomain: 'transcriptic', feature_groups: [] }));
    const getACS = sandbox.stub(AcsControls, 'isFeatureEnabled');
    getACS.withArgs(FeatureConstants.VIEW_SAMPLE_CONTAINERS).returns(false);
    getACS.withArgs(FeatureConstants.MANAGE_CONTAINERS_IN_LAB).returns(false);
    getACS.withArgs(FeatureConstants.TRANSFER_CONTAINER).returns(true);
    sandbox.stub(FeatureStore, 'hasFeature').withArgs(FeatureConstants.MANAGE_CONTAINER_LOCATIONS).returns(true);

    inventoryLayout = mount(<Router><InventoryLayout {...props} /></Router>);
    const tabs = inventoryLayout.find('li').map(tab => tab.text());
    expect(tabs.length).to.eql(1);
    expect(tabs[0]).to.eql('Locations');
  });

  it('should show inventory subtabs if container_location page is open', () => {
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.fromJS({ id: 'org13', subdomain: 'transcriptic', feature_groups: [] }));
    const getACS = sandbox.stub(AcsControls, 'isFeatureEnabled');
    getACS.withArgs(FeatureConstants.VIEW_SAMPLE_CONTAINERS).returns(true);
    getACS.withArgs(FeatureConstants.MANAGE_CONTAINERS_IN_LAB).returns(true);
    getACS.withArgs(FeatureConstants.TRANSFER_CONTAINER).returns(true);
    sandbox.stub(FeatureStore, 'hasFeature').withArgs(FeatureConstants.MANAGE_CONTAINER_LOCATIONS).returns(true);

    const newProps = {
      match: {
        params: {
          subdomain: 'transcriptic',
          containerId: 'ct18c9yryhmpk3'
        },
        path: '/:subdomain/inventory/container_location/:containerId/:wellIndex?'
      },
      history: {}
    };

    inventoryLayout = mount(<Router><InventoryLayout {...newProps} /></Router>);
    const tabs = inventoryLayout.find('li').map(tab => tab.text());
    expect(tabs).to.exist;
    expect(tabs[0]).to.eql('Locations');
  });

  it('should display "Destruction requests" tab if user has correct permissions', () => {
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.fromJS({ id: 'org13', subdomain: 'transcriptic', feature_groups: [] }));
    const getACS = sandbox.stub(AcsControls, 'isFeatureEnabled');
    getACS.withArgs(FeatureConstants.MANAGE_CONTAINER_DESTRUCTION_REQUESTS).returns(true);
    getACS.withArgs(FeatureConstants.TRANSFER_CONTAINER).returns(true);

    inventoryLayout = mount(<Router><InventoryLayout {...props} /></Router>);
    const tabs = inventoryLayout.find('li').map(tab => tab.text());
    expect(tabs.length).to.eql(1);
    expect(tabs[0]).to.eql('Destruction requests');
  });

  it('should display "Stale" tab if user has correct permissions', () => {
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.fromJS({ id: 'org13', subdomain: 'transcriptic', feature_groups: [] }));
    const getACS = sandbox.stub(AcsControls, 'isFeatureEnabled');
    getACS.withArgs(FeatureConstants.MANAGE_STALE_CONTAINERS).returns(true);
    getACS.withArgs(FeatureConstants.TRANSFER_CONTAINER).returns(true);
    sandbox.stub(FeatureStore, 'hasFeature').withArgs(FeatureConstants.MANAGE_STALE_CONTAINERS).returns(true);

    inventoryLayout = mount(<Router><InventoryLayout {...props} /></Router>);
    const tabs = inventoryLayout.find('li').map(tab => tab.text());
    expect(tabs.length).to.eql(1);
    expect(tabs[0]).to.eql('Stale');
  });

  it('should display "IDT orders" tab if user has correct permissions', () => {
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.fromJS({ id: 'org13', subdomain: 'transcriptic', feature_groups: [] }));
    const getACS = sandbox.stub(AcsControls, 'isFeatureEnabled');
    getACS.withArgs(FeatureConstants.MANAGE_IDT_ORDERS).returns(true);
    getACS.withArgs(FeatureConstants.TRANSFER_CONTAINER).returns(true);
    sandbox.stub(FeatureStore, 'hasFeature').withArgs(FeatureConstants.MANAGE_IDT_ORDERS).returns(true);

    inventoryLayout = mount(<Router><InventoryLayout {...props} /></Router>);
    const tabs = inventoryLayout.find('li').map(tab => tab.text());
    expect(tabs.length).to.eql(1);
    expect(tabs[0]).to.eql('IDT orders');
  });
});
