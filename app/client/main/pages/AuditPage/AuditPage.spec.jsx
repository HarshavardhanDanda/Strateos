import { expect } from 'chai';
import sinon from 'sinon';
import Immutable from 'immutable';

import React from 'react';
import { shallow } from 'enzyme';
import { MemoryRouter as Router } from 'react-router-dom';
import {
  Banner
} from '@transcriptic/amino';
import AuditPage from 'main/pages/AuditPage';
import SessionStore from 'main/stores/SessionStore';
import AuditConfigStore from 'main/stores/AuditConfigStore';

describe('Audit Page test', () => {
  let auditPage;
  const sandbox = sinon.createSandbox();

  beforeEach(() => {
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.fromJS({ id: 'test_org' }));
    sandbox.stub(AuditConfigStore, 'getByOrganizationId').withArgs('test_org').returns(Immutable.List.of(Immutable.fromJS({ auditConfigState: 'ENABLED' })));
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('Check if Page is Present', () => {
    auditPage = shallow(
      <Router>
        <AuditPage  />
      </Router>
    );
    expect(auditPage.find('PageLayout')).to.exist;
  });

  it('should show the banner when the audit is disabled for an organization', () => {
    auditPage = shallow(
      <AuditPage  />
    ).setState({ auditConfigurationStatus: 'DISABLED' });
    expect(auditPage.find(Banner)).to.have.length(1);
    expect(auditPage.find(Banner).prop('bannerMessage')).to.be.equal('The organization is currently not subscribed to Audit. To subscribe, please contact the Customer Support team.');
    expect(auditPage.find(Banner).prop('bannerType')).to.be.equal('info');
  });

  it('should not show the banner when the audit is enabled for an organization', () => {
    auditPage = shallow(
      <AuditPage  />
    ).setState({ auditConfigurationStatus: 'ENABLED' });
    expect(auditPage.find(Banner)).to.have.length(0);
  });
});
