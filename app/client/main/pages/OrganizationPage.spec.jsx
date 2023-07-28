import React from 'react';

import { expect } from 'chai';
import { shallow } from 'enzyme';
import { Page, TabRouter } from '@transcriptic/amino';
import sinon from 'sinon';
import FeatureConstants from '@strateos/features';
import AcsControls from 'main/util/AcsControls';
import * as AuditTrailUtil from 'main/util/AuditTrailUtil';
import { OrganizationPage, Tabs } from './OrganizationPage';

const routeProps = {
  match: {
    params: {
      subdomain: 'Billing'
    },
    path: ''
  }
};

describe('Organization Page', () => {
  let component;
  const sandbox = sinon.createSandbox();

  afterEach(() => {
    if (component) {
      component.unmount();
    }
    sandbox.restore();
  });

  it('Check if Page is Present', () => {
    const ref = shallow(
      <OrganizationPage {...routeProps} canAdmin />
    );
    const Page1 = ref.find(Page);
    expect(Page1.length).to.be.eql(1);
  });

  it('Check Tabrouter', () => {
    const ref = shallow(
      <OrganizationPage {...routeProps} canAdmin />
    ).dive();
    const TabRouter1 = ref.find(TabRouter);
    expect(TabRouter1.length).to.equal(1);
  });

  it('admin should have billing access', () => {
    component = shallow(
      <Tabs canAdmin />
    );

    const Billing = component.find('NavLink').findWhere(l => l.text() === 'Billing');
    expect(Billing).to.have.length(1);
  });

  it('user should not have billing access', () => {
    component = shallow(
      <Tabs canAdmin={false} />
    );

    const Billing = component.find('NavLink').findWhere(l => l.text() === 'Billing');
    expect(Billing).to.have.length(0);
  });

  it('should render audit tab if user has VIEW_AUDIT_TRAIL permission and audit trail configuration is enabled atleast once', () => {
    sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.VIEW_AUDIT_TRAIL).returns(true);
    sandbox.stub(AuditTrailUtil, 'auditTrailEnabledAtleastOnce').returns(true);
    component = shallow(
      <Tabs  />
    );
    const Audit = component.find('NavLink').findWhere(l => l.text() === 'Audit');
    expect(Audit).to.have.length(1);
  });

  it('should not render audit tab if user does not have VIEW_AUDIT_TRAIL', () => {
    component = shallow(
      <Tabs  />
    );
    const Audit = component.find('NavLink').findWhere(l => l.text() === 'Audit');
    expect(Audit).to.have.length(0);
  });

  it('should not render audit tab audit trail configuration is not enabled atleast once', () => {
    sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.VIEW_AUDIT_TRAIL).returns(true);
    sandbox.stub(AuditTrailUtil, 'auditTrailEnabledAtleastOnce').returns(false);
    component = shallow(
      <Tabs  />
    );
    const Audit = component.find('NavLink').findWhere(l => l.text() === 'Audit');
    expect(Audit).to.have.length(0);
  });
});
