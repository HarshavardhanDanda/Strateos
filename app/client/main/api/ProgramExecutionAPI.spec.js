import sinon from 'sinon';
import { expect } from 'chai';
import ajax from 'main/util/ajax';
import ProgramExecutionAPI from './ProgramExecutionAPI';
import Urls from '../util/urls';

describe('ProgramExecutionAPI', () => {
  const sandbox = sinon.createSandbox();
  afterEach(() => {
    sandbox.restore();
  });
  it('should call createAndExecutePostRunProgram api', () => {
    const post = sandbox.stub(ajax, 'post').returns({
      done: (cb) => {
        cb();
        return { fail: () => ({}) };
      }
    });
    const runId = 'runId';
    ProgramExecutionAPI.createAndExecutePostRunProgram(runId);
    expect(post.calledOnce).to.be.true;
    expect(post.calledWithExactly(Urls.create_and_execute_post_run_program(), { run_id: runId })).to.be.true;
  });
});
