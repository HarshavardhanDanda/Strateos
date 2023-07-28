import sinon from 'sinon';
import { expect } from 'chai';
import ajax from 'main/util/ajax';
import SessionStore from 'main/stores/SessionStore';
import Immutable from 'immutable';
import LabConsumerActions from './LabConsumerActions';

describe('Labconsumer actions', () => {
  const sandbox = sinon.createSandbox();
  afterEach(() => {
    sandbox.restore();
  });

  it('should load labs for current org', () => {
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.Map({ id: 'org123' }));
    const get = sandbox.stub(ajax, 'get').returns({
      done: (cb) => {
        cb({ meta: {
          record_count: 5
        } });
        return { fail: () => ({}) };
      }
    });
    LabConsumerActions.loadLabsForCurrentOrg();
    expect(get.calledOnce);
    expect(get.calledWithExactly(
      '/api/lab_consumers?include=lab,organization&fields[organizations]=id,name,subdomain&filter[organization_id]=org123&sort=lab.name'
    )).to.be.true;
  });

  it('should load labs by org', () => {
    const orgId = 'org123';
    const get = sandbox.stub(ajax, 'get').returns({
      done: (cb) => {
        cb({ meta: {
          record_count: 5
        } });
        return { fail: () => ({}) };
      }
    });
    LabConsumerActions.loadLabsByOrg(orgId);
    expect(get.calledOnce);
    expect(get.calledWithExactly(
      `/api/lab_consumers?include=lab,organization&fields[organizations]=id,name,subdomain&filter[organization_id]=${orgId}&sort=lab.name`
    )).to.be.true;
  });

  it('should load lab_consumers by lab', () => {
    const labId = 'lab123';
    const get = sandbox.stub(ajax, 'get').returns({
      done: (cb) => {
        cb({ meta: {
          record_count: 5
        } });
        return { fail: () => ({}) };
      }
    });
    LabConsumerActions.loadLabConsumersByLab(labId);

    expect(get.calledOnce);
    expect(get.calledWithExactly(
      `/api/lab_consumers?include=lab,organization&fields[organizations]=id,name,subdomain&filter[lab_id]=${labId}`
    )).to.be.true;
  });
});
