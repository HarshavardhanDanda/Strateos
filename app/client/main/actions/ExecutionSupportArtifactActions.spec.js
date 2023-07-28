import sinon from 'sinon';
import ajax from 'main/util/ajax';
import Urls from 'main/util/urls';
import { expect } from 'chai';
import ExecutionSupportArtifactActions from './ExecutionSupportArtifactActions';

describe('ExecutionSupportArtifactActions', () => {
  const runId = 'r1eg7pvd8mcaa3';
  const instructionIds = ['i1eg7pvdcaa049', 'i1eg7pvdcaa050'];
  const operation = 'sanger_sequence';
  const sortKey = 'created_at';
  const limit = 12;
  const offset = 12;
  const sandbox = sinon.createSandbox();

  afterEach(() => {
    sandbox.restore();
  });

  it('should successfully get ESA in desc order', () => {
    const get = sandbox.stub(ajax, 'get')
      .returns({ fail: () => ({})
      }
      );
    const sortDirection = 'desc';
    ExecutionSupportArtifactActions.fetchExecutionSupportArtifacts(runId, instructionIds, sortKey, sortDirection, limit, offset);
    expect(get.calledOnce);
    expect(get.calledWithExactly(
      '/api/runs/r1eg7pvd8mcaa3/execution_support_artifacts?fields[execution_support_artifacts]=name,created_at,operation,status,presigned_url&filter[includes_all_instruction_ids]=i1eg7pvdcaa049,i1eg7pvdcaa050&page[limit]=12&page[offset]=12&sort=-created_at'
    )).to.be.true;
  });

  it('should successfully get ESA in asc order', () => {
    const get = sandbox.stub(ajax, 'get')
      .returns({ fail: () => ({})
      }
      );
    const sortDirection = 'asc';
    ExecutionSupportArtifactActions.fetchExecutionSupportArtifacts(runId, instructionIds, sortKey, sortDirection, limit, offset);
    expect(get.calledOnce);
    expect(get.calledWithExactly(
      '/api/runs/r1eg7pvd8mcaa3/execution_support_artifacts?fields[execution_support_artifacts]=name,created_at,operation,status,presigned_url&filter[includes_all_instruction_ids]=i1eg7pvdcaa049,i1eg7pvdcaa050&page[limit]=12&page[offset]=12&sort=created_at'
    )).to.be.true;
  });

  it('should make a post call to regenerate ESA', () => {
    const post = sandbox.stub(ajax, 'post').returns({ fail: () => ({}) });
    ExecutionSupportArtifactActions.regenerateExecutionSupportArtifact(runId, instructionIds, operation);
    expect(post.calledOnce);
    expect(post.calledWithExactly(Urls.generate_execution_support_artifact(runId), { run_id: runId, instruction_ids: instructionIds, operation: operation })).to.be.true;
  });
});
