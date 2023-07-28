import sinon from 'sinon';
import { expect } from 'chai';
import Urls from 'main/util/urls';
import HTTPUtil from 'main/util/HTTPUtil';
import AuditTrailActions from './AuditTrailActions';

describe('AuditTrail Actions', () => {

  const sandbox = sinon.createSandbox();
  let get;
  const org_id = 'org1';
  const mockAuditConfigResponse = { id: 'auditId1', auditConfigState: 'ENABLED' };
  const mockAuditConfigHistoryResponse = { content: [{ oldState: 'DISABLED' }] };

  afterEach(() => {
    sandbox.restore();
  });

  it('should succesfully get AuditConfiguration', () => {
    get = sandbox.stub(HTTPUtil, 'get').returns({
      done: (cb) => {
        cb(mockAuditConfigResponse);
        return { fail: () => ({}) };
      }
    });
    AuditTrailActions.loadAuditConfiguration(org_id);
    expect(get.calledWithExactly(Urls.audit_configuration(org_id))).to.be.true;
  });

  it('should succesfully get AuditConfigurationHistory', () => {
    get = sandbox.stub(HTTPUtil, 'get').returns({
      done: (cb) => {
        cb(mockAuditConfigHistoryResponse);
        return { fail: () => ({}) };
      }
    });
    AuditTrailActions.loadAuditConfigurationHistory(org_id);
    expect(get.calledWithExactly(Urls.audit_configuration_history(org_id))).to.be.true;
  });
});
