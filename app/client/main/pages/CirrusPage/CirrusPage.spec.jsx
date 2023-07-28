import { expect } from 'chai';
import Immutable from 'immutable';
import React from 'react';
import { mount } from 'enzyme';
import { MemoryRouter as Router } from 'react-router-dom';
import sinon from 'sinon';
import AcsControls from 'main/util/AcsControls';
import FeatureConstants from '@strateos/features';
import FederatedWrapper from 'main/components/FederatedWrapper';
import WorkflowStore from '../../stores/WorkflowStore';
import CirrusPage from './CirrusPage';
import { WorkflowActions } from '../../actions/WorkflowActions';

describe('CirrusPage', () => {
  var sandbox = sinon.createSandbox();
  let cirrusPage;
  const pathname = '/transcriptic/workflows/builder/wfId';
  var matchPropTypes = { params: { subdomain: 'transcriptic/workflows', 0: '' } };
  let spy;

  beforeEach(() => {
    sandbox.stub(FederatedWrapper.prototype, 'render').returns(null);
  });

  afterEach(() => {
    sandbox.restore();
    cirrusPage.unmount();
  });

  it('should show 404 for disallowed users', () => {
    sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.CIRRUS).returns(false);
    cirrusPage = mount(<Router><CirrusPage match={matchPropTypes} location={{ pathname }} /></Router>);
    expect(cirrusPage.find('Page[statusCode=404]').length).to.equal(1);
  });

  it('should show unable to load workflow builder error when cirrus fails to load', () => {
    sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.CIRRUS).returns(true);
    cirrusPage = mount(<Router><CirrusPage match={matchPropTypes} location={{ pathname }} /></Router>);
    expect(cirrusPage.find('FederatedWrapper').at(1).props().error.props.children).to.equal('Unable to load Workflow Builder.');
    expect(cirrusPage.find('FederatedWrapper').at(2).props().error.props.children).to.equal('Unable to load Workflow Builder.');
  });

  it('should show 200 for allowed users', () => {
    sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.CIRRUS).returns(true);
    cirrusPage = mount(<Router><CirrusPage match={matchPropTypes} location={{ pathname }} /></Router>);
    expect(cirrusPage.find('Page[statusCode=200]').length).to.equal(1);
  });

  it('should render default layout correctly', () => {
    sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.CIRRUS).returns(true);
    cirrusPage = mount(<Router><CirrusPage match={matchPropTypes} location={{ pathname }} /></Router>);
    expect(cirrusPage.find('TabLayout')).to.have.length(1);
    expect(cirrusPage.find('FederatedWrapper')).to.have.length(3);
  });

  it('should have root header as workflows by default', () => {
    sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.CIRRUS).returns(true);
    cirrusPage = mount(<Router><CirrusPage match={matchPropTypes} location={{ pathname }} /></Router>);
    expect(cirrusPage.find('TabLayout')).to.have.length(1);
    expect(cirrusPage.find('FederatedWrapper')).to.have.length(3);
    const breadCrumbs = cirrusPage.find('Breadcrumbs');
    expect(breadCrumbs.text()).to.be.equals('Workflows');
  });

  it('should have root header as experiments ', () => {
    sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.CIRRUS).returns(true);
    matchPropTypes = { params: {
      ...matchPropTypes.params, 0: 'experiments'
    } };
    cirrusPage = mount(<Router><CirrusPage match={matchPropTypes} location={{ pathname }} /></Router>);
    expect(cirrusPage.find('TabLayout')).to.have.length(1);
    expect(cirrusPage.find('FederatedWrapper')).to.have.length(3);
    const breadCrumbs = cirrusPage.find('Breadcrumbs');
    expect(breadCrumbs.text()).to.be.equals('Experiments');
  });

  it('should have workflow name in breadcrumbs with Workflows as root header', () => {
    sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.CIRRUS).returns(true);
    sandbox.stub(WorkflowStore, 'getById').returns(Immutable.Map({ label: 'test-123' }));

    matchPropTypes = {
      url: 'transcriptic/workflows/workflows/wfId',
      params: { ...matchPropTypes.params, 0: 'workflows/a24a6ea4-ce75-4665-a070-57453082c256' }
    };
    cirrusPage = mount(<Router><CirrusPage match={matchPropTypes} location={{ pathname }} /></Router>);
    expect(cirrusPage.find('TabLayout')).to.have.length(1);
    expect(cirrusPage.find('FederatedWrapper')).to.have.length(3);
    const breadCrumbs = cirrusPage.find('Breadcrumbs');
    expect(breadCrumbs.text()).includes('Workflows');
    expect(breadCrumbs.text()).includes('test-123');
  });

  it('should have workflow name in breadcrumbs with Experiments as root header', () => {
    sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.CIRRUS).returns(true);
    sandbox.stub(WorkflowStore, 'getById').returns(Immutable.Map({ label: 'test-123' }));

    matchPropTypes = {
      url: 'transcriptic/workflows/experiments/a24a6ea4-ce75-4665-a070-57453082c256',
      params: { ...matchPropTypes.params, 0: 'experiments/a24a6ea4-ce75-4665-a070-57453082c256' }
    };
    cirrusPage = mount(<Router><CirrusPage match={matchPropTypes} location={{ pathname: matchPropTypes.url }} /></Router>);
    expect(cirrusPage.find('TabLayout')).to.have.length(1);
    expect(cirrusPage.find('FederatedWrapper')).to.have.length(3);
    const breadCrumbs = cirrusPage.find('Breadcrumbs');
    expect(breadCrumbs.text()).includes('Experiments');
    expect(breadCrumbs.text()).includes('test-123');
  });

  it('should call loadDefinations api', () => {
    sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.CIRRUS).returns(true);
    sandbox.stub(WorkflowStore, 'getById').returns(undefined);
    spy = sandbox.spy(WorkflowActions, 'loadDefinitions');

    matchPropTypes = {
      url: 'transcriptic/workflows/workflows/wfId',
      params: { ...matchPropTypes.params, 0: 'workflows/a24a6ea4-ce75-4665-a070-57453082c256' }
    };
    cirrusPage = mount(<Router><CirrusPage match={matchPropTypes} location={{ pathname }} /></Router>);
    expect(spy.calledOnce).to.be.true;
  });

  it('should call loadExecutions api', () => {
    sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.CIRRUS).returns(true);
    sandbox.stub(WorkflowStore, 'getById').returns(undefined);
    spy = sandbox.spy(WorkflowActions, 'loadExecutions');

    matchPropTypes = {
      url: 'transcriptic/workflows/experiments/a24a6ea4-ce75-4665-a070-57453082c256',
      params: { ...matchPropTypes.params, 0: 'experiments/a24a6ea4-ce75-4665-a070-57453082c256' }
    };
    cirrusPage = mount(<Router><CirrusPage match={matchPropTypes} location={{ pathname: matchPropTypes.url }} /></Router>);
    expect(spy.calledOnce).to.be.true;
  });

  it('should have Workflows in breadcrumbs on viewer page', () => {
    sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.CIRRUS).returns(true);
    sandbox.stub(WorkflowStore, 'getById').returns(Immutable.Map({ label: 'test-123' }));
    matchPropTypes = {
      url: 'transcriptic/workflows/viewer/wfId',
      params: { ...matchPropTypes.params, 0: 'viewer/a24a6ea4-ce75-4665-a070-57453082c256' }
    };
    cirrusPage = mount(<Router><CirrusPage match={matchPropTypes} location={{ pathname: matchPropTypes.url }} /></Router>);
    expect(cirrusPage.find('TabLayout')).to.have.length(1);
    expect(cirrusPage.find('FederatedWrapper')).to.have.length(3);
    const breadCrumbs = cirrusPage.find('Breadcrumbs');
    expect(breadCrumbs.text()).includes('Workflows');
    expect(breadCrumbs.text()).includes('test-123');
  });

  it('should have Workflows in breadcrumbs on builder page', () => {
    sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.CIRRUS).returns(true);
    sandbox.stub(WorkflowStore, 'getById').returns(Immutable.Map({ label: 'test-123' }));
    matchPropTypes = {
      url: 'transcriptic/workflows/builder/a24a6ea4-ce75-4665-a070-57453082c256',
      params: { ...matchPropTypes.params, 0: 'builder/a24a6ea4-ce75-4665-a070-57453082c256' }
    };
    cirrusPage = mount(<Router><CirrusPage match={matchPropTypes} location={{ pathname: matchPropTypes.url }} /></Router>);
    expect(cirrusPage.find('TabLayout')).to.have.length(1);
    expect(cirrusPage.find('FederatedWrapper')).to.have.length(3);
    const breadCrumbs = cirrusPage.find('Breadcrumbs');
    expect(breadCrumbs.text()).includes('Workflows');
    expect(breadCrumbs.text()).includes('test-123');
  });

  it('should not have page header actionMenu undefined', () => {
    sandbox.stub(AcsControls, 'isFeatureEnabled').returns(true);
    cirrusPage = mount(<Router><CirrusPage match={matchPropTypes} location={{ pathname }} /></Router>);
    const pageHeaderActionMenu = cirrusPage.find('PageHeader').props().actionMenu;
    expect(pageHeaderActionMenu).not.to.be.undefined;
  });

  it('should have updated workflow name in breadcrumbs', () => {
    sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.CIRRUS).returns(true);
    const mockGetById = sandbox.stub(WorkflowStore, 'getById');
    mockGetById.onCall(0).returns(Immutable.Map({ label: 'workflow label' }));
    mockGetById.onCall(1).returns(Immutable.Map({ label: 'updated workflow label' }));
    const mockLoadDefinition = sandbox.stub(WorkflowActions, 'loadDefinitions').returns({
      then: (cb) => {
        cb();
      }
    });

    matchPropTypes = {
      url: 'transcriptic/workflows/builder/a24a6ea4-ce75-4665-a070-57453082c256',
      params: { ...matchPropTypes.params, 0: 'builder/a24a6ea4-ce75-4665-a070-57453082c256' }
    };
    cirrusPage = mount(<Router><CirrusPage match={matchPropTypes} location={{ pathname: matchPropTypes.url, state: { isWorkflowEdited: true } }} /></Router>);

    expect(mockLoadDefinition.calledOnce).to.be.true;
    const updatedBreadCrumbs = cirrusPage.find('Breadcrumbs');
    expect(updatedBreadCrumbs.text()).includes('Workflows');
    expect(updatedBreadCrumbs.text()).includes('updated workflow label');
  });
});
