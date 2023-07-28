import sinon from 'sinon';
import ajax from 'main/util/ajax';
import { expect } from 'chai';
import BatchRunsActions from 'main/pages/CompoundsPage/BatchRunsActions';

describe('BatchRunsActions', () => {
  const batchId = 'bat1gyz9wwx3n4xj';
  const sortKey = 'created_at';
  const limit = 12;
  const offset = 12;
  const sandbox = sinon.createSandbox();

  afterEach(() => {
    sandbox.restore();
  });

  it('should successfully get batch related runs in desc order', () => {
    const get = sandbox.stub(ajax, 'get').returns({
      done: (cb) => {
        cb([]);
        return { fail: () => ({}) };
      }
    });
    const sortDirection = 'desc';
    BatchRunsActions.fetchBatchRelatedRuns(batchId, sortKey, sortDirection, limit, offset);
    expect(get.calledOnce);
    expect(get.calledWithExactly(
      '/api/v1/batches/bat1gyz9wwx3n4xj/runs?include=owner&fields[runs]=status,completed_at,title,project_id,success_notes,owner_id,organization_id&page[limit]=12&page[offset]=12&sort=-created_at'
    )).to.be.true;
  });

  it('should successfully get batch related runs in asc order', () => {
    const get = sandbox.stub(ajax, 'get').returns({
      done: (cb) => {
        cb([]);
        return { fail: () => ({}) };
      }
    });
    const sortDirection = 'asc';
    BatchRunsActions.fetchBatchRelatedRuns(batchId, sortKey, sortDirection, limit, offset);
    expect(get.calledOnce);
    expect(get.calledWithExactly(
      '/api/v1/batches/bat1gyz9wwx3n4xj/runs?include=owner&fields[runs]=status,completed_at,title,project_id,success_notes,owner_id,organization_id&page[limit]=12&page[offset]=12&sort=created_at'
    )).to.be.true;
  });
});
