import React from 'react';
import { expect } from 'chai';
import { mount } from 'enzyme';
import { BrowserRouter as Router } from 'react-router-dom';
import Urls from 'main/util/urls';
import sinon from 'sinon';
import RunAPI from 'main/api/RunAPI';
import SessionStore from 'main/stores/SessionStore';
import FeatureStore from 'main/stores/FeatureStore';
import OrganizationStore from 'main/stores/OrganizationStore';
import UserPreference from 'main/util/UserPreferenceUtil';
import AcsControls from 'main/util/AcsControls';
import FeatureConstants from '@strateos/features';

import Immutable from 'immutable';
import { RunsPage }  from './RunsPage';

describe('Runs Page', () => {
  let runsPage;
  let context;
  const sandbox = sinon.createSandbox();
  const props = {
    match: {
      path: '/strateos/runspage/queue/all_runs',
      params: {
        subdomain: 'strateos',
        runStatus: 'all_runs'
      }
    }
  };
  Urls.use('strateos');
  const user = {
    id: 'u18dcbwhctbnj',
    name: 'john doe',
    email: 'jdoe@transcriptic.com',
    lastSignInIp: '0.0.0.0',
    createdAt: '2020-05-27T09:16:16.522-07:00'
  };
  const labIds = [{ labId: 'lab1' }, { labId: 'lab2' }];

  afterEach(() => {
    if (runsPage) runsPage.unmount();
    sandbox.restore();
  });

  beforeEach(() => {
    sandbox.stub(FeatureStore, 'getLabIdsWithFeatures').returns(Immutable.Map(labIds));
    sandbox.stub(SessionStore, 'getUser').returns(Immutable.Map(user));
    sandbox.stub(FeatureStore, 'canManageRunState').returns(true);
    sandbox.stub(OrganizationStore, 'isStrateosAccount').returns(false);
    const get = sandbox.stub(UserPreference, 'get');
    get.withArgs('run_filters').returns({});
    get.withArgs('RunListView').returns(undefined);
    sandbox.stub(FeatureStore, 'getLabIds').returns(Immutable.List(['lab1', 'lab2']));

    sandbox.stub(RunAPI, 'index').returns({
      then: () => {}
    });
  });

  const stubContextForRunsPage = (() => {
    context = React.createContext({
      labStore: {
        fetchRelatedObjects: () => {},
        fetchLabs: () => {}
      },
      runFilterStore: {
        init: () => {}
      }
    });
    sandbox.stub(RunsPage, 'contextType').value(context);
  });

  it('should have page title', () => {
    runsPage = mount(<Router><RunsPage {...props} /></Router>);
    const Page = runsPage.find('Page');
    expect(Page.prop('title')).to.equal('Runs');
  });

  it('should have tab router', () => {
    runsPage = mount(<Router><RunsPage {...props} /></Router>);
    const TabRouter = runsPage.find('TabRouter');
    expect(TabRouter.length).to.equal(1);
  });

  it('should have `Queue` tab as default', () => {
    sandbox.stub(FeatureStore, 'hasApp').withArgs('VIEW_RUNS_IN_LABS').returns(true);
    runsPage = mount(<Router><RunsPage {...props} /></Router>);
    const TabRouter = runsPage.find('TabRouter');
    expect(TabRouter.prop('defaultTabId')).to.equal('queue');
  });

  it('should have `Queue` and `Approvals` tabs if the user has `RUN_STATE_MGMT` feature', () => {
    const feature_store = sandbox.stub(FeatureStore, 'hasApp');
    feature_store.withArgs('RUN_STATE_MGMT').returns(true);
    feature_store.withArgs('VIEW_RUNS_IN_LABS').returns(true);
    runsPage = mount(<Router><RunsPage {...props} /></Router>);

    const tabs = runsPage.find('li').map(tab => tab.text());
    expect(tabs.length).to.eql(2);
    expect(tabs[0]).to.eql('Queue');
    expect(tabs[1]).to.eql('Approvals');

  });

  it('should show QueueView by default', () => {
    sandbox.stub(FeatureStore, 'hasApp').withArgs('VIEW_RUNS_IN_LABS').returns(true);
    runsPage = mount(<Router><RunsPage {...props} /></Router>);
    expect(runsPage.find('QueueView')).to.have.lengthOf(1);
  });

  it('should call isFeaturedEnabled with feature VIEW_DEVICES', () => {
    const acsControlSpy = sandbox.spy(AcsControls, 'isFeatureEnabled');
    runsPage = mount(<Router><RunsPage {...props} /></Router>);
    expect(acsControlSpy.calledWith(FeatureConstants.VIEW_DEVICES)).to.be.true;
  });

  it('should call fetchRelatedObjects', () => {
    stubContextForRunsPage();
    sandbox.stub(AcsControls, 'isFeatureEnabled').returns(true);
    const fetchRelatedObjectsStub = sandbox.stub(context._currentValue.labStore, 'fetchRelatedObjects');
    runsPage = mount(<Router><RunsPage {...props} /></Router>);
    expect(fetchRelatedObjectsStub.args[0].length === 2);
    expect(fetchRelatedObjectsStub.args[1] === true);
    expect(fetchRelatedObjectsStub.calledOnce).to.be.true;
  });
});
