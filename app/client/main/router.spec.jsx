import React from 'react';
import Immutable from 'immutable';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import { Route, BrowserRouter as Router, MemoryRouter } from 'react-router-dom';
import sinon from 'sinon';

import BillingPage from 'main/pages/BillingPage';
import FeatureStore from 'main/stores/FeatureStore';
import Urls from 'main/util/urls';
import Root, { getLandingPage } from 'main/router';
import OperatorDashboardPage from 'main/pages/OperatorDashboardPage';
import ConnectedOrganizationPage from 'main/pages/OrganizationPage';
import SessionStore from 'main/stores/SessionStore';
import AcsControls from 'main/util/AcsControls';
import FeatureConstants from '@strateos/features';
import AuditConfigStore from 'main/stores/AuditConfigStore';

describe('Router', () => {
  let wrapper, pathMap;
  const sandbox = sinon.createSandbox();

  before(() => {
    sandbox.stub(FeatureStore, 'hasPlatformFeature').returns(true);
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.fromJS({ id: 'test_org', feature_groups: ['operator_dashboard'] }));
    sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.SUBMIT_INSTRUCTIONS_TO_EXECUTE).returns(true).withArgs(FeatureConstants.VIEW_AUDIT_TRAIL)
      .returns(true);
    sandbox.stub(AuditConfigStore, 'getByOrganizationId').withArgs('test_org').returns(Immutable.List.of(Immutable.fromJS({ auditConfigState: 'ENABLED' })));
    const wrapper = shallow(<MemoryRouter><Root /></MemoryRouter>);
    const routes = shallow(
      <Router>
        {
      wrapper.dive().find(Root).dive().find(Route)
        .at('4')
        .dive()
        .find('MainApp')
        .dive()
        .find(Route)
        .props()
        .render()
      }
      </Router>
    );
    pathMap = routes.find(Route).reduce((path, route) => {
      const routeProps = route.props();
      path[routeProps.path] = routeProps.component;
      return path;
    }, {});
  });
  after(() => {
    if (wrapper) {
      wrapper.unmount();
    }
    sandbox.restore();
  });

  it('should render correct routes for Billing Page', () => {
    expect(pathMap[Urls.billing()]).to.eql(BillingPage);
    expect(pathMap[Urls.pending_invoices()]).to.eql(BillingPage);
    expect(pathMap[Urls.history()]).to.eql(BillingPage);
    expect(pathMap[Urls.quality_control()]).to.eql(BillingPage);
    expect(pathMap[Urls.po_approval()]).to.eql(BillingPage);
  });

  it('should render correct route for Operator Dashboard Page', () => {
    expect(pathMap[Urls.operator_dashboard()]).to.eql(OperatorDashboardPage);
  });

  it('should render correct route for Audit Page', () => {
    expect(pathMap['/:subdomain/audit']).to.eql(ConnectedOrganizationPage);
  });

  it('should render correct route for user which only has platform feature', () => {
    sandbox.restore();
    sandbox.stub(FeatureStore, 'hasPlatformFeature').returns(true);
    expect(getLandingPage()).to.equal('bills');
  });
});
