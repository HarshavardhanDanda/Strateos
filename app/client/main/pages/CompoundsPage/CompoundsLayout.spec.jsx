import React from 'react';
import { expect } from 'chai';
import { mount } from 'enzyme';
import Immutable from 'immutable';
import sinon from 'sinon';
import { BrowserRouter as Router } from 'react-router-dom';

import Urls from 'main/util/urls';
import AcsControls from 'main/util/AcsControls';
import FeatureConstants from '@strateos/features';
import SessionStore from 'main/stores/SessionStore';
import BatchesPage from 'main/pages/CompoundsPage/BatchesPage';
import CompoundsTab from 'main/pages/CompoundsPage/CompoundsLayout';
import CompoundsPage from 'main/pages/CompoundsPage/CompoundsPage';

const props = {
  match: {
    path: Urls.compounds()
  }
};

describe('CompoundsLayout', () => {
  let compoundsLayout;
  const sandbox = sinon.createSandbox();

  beforeEach(() => {
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.Map({ id: 'org13' }));
    const getACS = sandbox.stub(AcsControls, 'isFeatureEnabled');
    getACS.withArgs(FeatureConstants.COMPOUND_MGMT).returns(true);
    getACS.withArgs(FeatureConstants.VIEW_BATCHES).returns(true);
    getACS.withArgs(FeatureConstants.MANAGE_BATCHES_IN_LAB).returns(true);
    Urls.use('strateos');
  });

  afterEach(() => {
    sandbox.restore();
    if (compoundsLayout) compoundsLayout.unmount();
  });

  it('should contain a tab router', () => {
    compoundsLayout = mount(<Router><CompoundsTab {...props} /></Router>);
    const TabRouter = compoundsLayout.find('TabRouter');
    expect(TabRouter.length).to.equal(1);
  });

  it('should show compounds sub tab by default', () => {
    compoundsLayout = mount(<Router><CompoundsTab {...props} /></Router>);
    const TabRouter = compoundsLayout.find('TabRouter');
    expect(TabRouter.prop('defaultTabId')).to.be.eql('compounds');
  });

  it('should have Compounds and Batches tabs', () => {
    compoundsLayout = mount(<Router><CompoundsTab {...props} /></Router>);

    const tabs = compoundsLayout.find('li').map(tab => tab.text());
    expect(tabs.length).to.eql(2);

    expect(tabs[0]).to.eql('Compounds');
    expect(tabs[1]).to.eql('Batches');
  });

  it('should show Compounds page when Compounds tab is clicked', () => {
    const propsCompounds = {
      match: {
        path: Urls.compounds_page()
      },
      history: { length: 50 }
    };
    compoundsLayout = mount(<Router><CompoundsTab {...propsCompounds} /></Router>);
    expect(compoundsLayout.find(CompoundsPage)).to.have.lengthOf(1);
    expect(compoundsLayout.find(CompoundsPage).props().history).to.deep.equal({ length: 50 });
  });

  it('should show Batches page when Batches tab is clicked', () => {
    const propsBatches = {
      match: {
        path: Urls.batches_page()
      },
      history: { length: 50 }
    };
    compoundsLayout = mount(<Router><CompoundsTab {...propsBatches} /></Router>);
    expect(compoundsLayout.find(BatchesPage)).to.have.lengthOf(1);
  });

  it('should not show compounds tab, if compound management acs permission is not enabled', () => {
    sandbox.restore();
    const getACS = sandbox.stub(AcsControls, 'isFeatureEnabled');
    getACS.withArgs(FeatureConstants.COMPOUND_MGMT).returns(false);
    getACS.withArgs(FeatureConstants.VIEW_BATCHES).returns(true);
    getACS.withArgs(FeatureConstants.MANAGE_BATCHES_IN_LAB).returns(true);
    compoundsLayout = mount(<Router><CompoundsTab {...props} /></Router>);

    const tabs = compoundsLayout.find('li').map(tab => tab.text());
    expect(tabs.length).to.eql(1);
    expect(tabs[0]).to.not.eq('Compounds');
    expect(tabs[0]).to.eql('Batches');
  });

  it('should show Batches tab if user has VIEW_BATCHES permission', () => {
    sandbox.restore();
    const getACS = sandbox.stub(AcsControls, 'isFeatureEnabled');
    getACS.withArgs(FeatureConstants.VIEW_BATCHES).returns(true);
    getACS.withArgs(FeatureConstants.MANAGE_BATCHES_IN_LAB).returns(false);
    compoundsLayout = mount(<Router><CompoundsTab {...props} /></Router>);

    const tabs = compoundsLayout.find('li').map(tab => tab.text());
    expect(tabs.length).to.eql(1);
    expect(tabs[0]).to.eql('Batches');
  });

  it('should show Batches tab if user has MANAGE_BATCHES_IN_LAB permission', () => {
    sandbox.restore();
    const getACS = sandbox.stub(AcsControls, 'isFeatureEnabled');
    getACS.withArgs(FeatureConstants.VIEW_BATCHES).returns(false);
    getACS.withArgs(FeatureConstants.MANAGE_BATCHES_IN_LAB).returns(true);
    compoundsLayout = mount(<Router><CompoundsTab {...props} /></Router>);

    const tabs = compoundsLayout.find('li').map(tab => tab.text());
    expect(tabs.length).to.eql(1);
    expect(tabs[0]).to.eql('Batches');
  });

  it('should not show Batches tab, if both view batches and manage batches acs permissions are not enabled', () => {
    sandbox.restore();
    const getACS = sandbox.stub(AcsControls, 'isFeatureEnabled');
    getACS.withArgs(FeatureConstants.COMPOUND_MGMT).returns(true);
    getACS.withArgs(FeatureConstants.VIEW_BATCHES).returns(false);
    getACS.withArgs(FeatureConstants.MANAGE_BATCHES_IN_LAB).returns(false);
    compoundsLayout = mount(<Router><CompoundsTab {...props} /></Router>);

    const tabs = compoundsLayout.find('li').map(tab => tab.text());
    expect(tabs.length).to.eql(1);
    expect(tabs[0]).to.not.eq('Batches');
    expect(tabs[0]).to.eql('Compounds');
  });

  it('should show zero Tabs, if acs permissions are not enabled for compounds', () => {
    sandbox.restore();
    const getACS = sandbox.stub(AcsControls, 'isFeatureEnabled');
    getACS.withArgs(FeatureConstants.COMPOUND_MGMT).returns(false);
    getACS.withArgs(FeatureConstants.VIEW_BATCHES).returns(false);
    getACS.withArgs(FeatureConstants.MANAGE_BATCHES_IN_LAB).returns(false);
    compoundsLayout = mount(<Router><CompoundsTab {...props} /></Router>);
    const tabs = compoundsLayout.find('li').map(tab => tab.text());
    expect(tabs.length).to.eql(0);
  });

  it('should pass history prop to BatchesPage', () => {
    const propsBatches = {
      match: {
        path: Urls.batches_page()
      },
      history: { pathname: 'test' }
    };
    compoundsLayout = mount(<Router><CompoundsTab {...propsBatches} /></Router>);
    const batchesPageProps = compoundsLayout.find(BatchesPage).props();

    expect(batchesPageProps.history).to.deep.equal(propsBatches.history);
  });
});
