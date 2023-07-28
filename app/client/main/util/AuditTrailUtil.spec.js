import sinon from 'sinon';
import Immutable from 'immutable';
import { expect } from 'chai';

import * as AuditTrailUtil from 'main/util/AuditTrailUtil';
import SessionStore from 'main/stores/SessionStore';
import AuditConfigStore from 'main/stores/AuditConfigStore';
import AuditConfigHistoryStore from 'main/stores/AuditConfigHistoryStore';

const auditConfigurationEnabled = Immutable.List.of(Immutable.fromJS({ id: 'auditId1', auditConfigState: 'ENABLED' }));
const auditConfigurationHistoryEnabled = Immutable.List.of(Immutable.fromJS({ oldState: 'DISABLED' }), Immutable.fromJS({ oldState: 'ENABLED' }));
const auditConfigurationDisabled = Immutable.List.of(Immutable.fromJS({ id: 'auditId1', auditConfigState: 'DISABLED' }));
const auditConfigurationHistoryDisabled = Immutable.List.of(Immutable.fromJS({ oldState: 'DISABLED' }), Immutable.fromJS({ oldState: 'DISABLED' }));

describe('AuditTrailUtil', () => {
  const sandbox = sinon.createSandbox();

  beforeEach(() => {
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.fromJS({ id: 'test_org' }));
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('return true if audit configuration is enabled', () => {
    sandbox.stub(AuditConfigStore, 'getByOrganizationId').withArgs('test_org').returns(auditConfigurationEnabled);

    const enabledAtleastOnce = AuditTrailUtil.auditTrailEnabledAtleastOnce();
    expect(enabledAtleastOnce).to.be.true;

  });

  it('return true if audit configuration is currently disabled and enabled atleast once previously', () => {
    sandbox.stub(AuditConfigStore, 'getByOrganizationId').withArgs('test_org').returns(auditConfigurationDisabled);
    sandbox.stub(AuditConfigHistoryStore, 'getByAuditConfigId').withArgs('auditId1').returns(auditConfigurationHistoryEnabled);

    const enabledAtleastOnce = AuditTrailUtil.auditTrailEnabledAtleastOnce();
    expect(enabledAtleastOnce).to.be.true;

  });

  it('return false if audit configuration is currently disabled and not enabled atleast once', () => {
    sandbox.stub(AuditConfigStore, 'getByOrganizationId').withArgs('test_org').returns(auditConfigurationDisabled);
    sandbox.stub(AuditConfigHistoryStore, 'getByAuditConfigId').withArgs('auditId1').returns(auditConfigurationHistoryDisabled);

    const enabledAtleastOnce = AuditTrailUtil.auditTrailEnabledAtleastOnce();
    expect(enabledAtleastOnce).to.be.false;
  });

});
