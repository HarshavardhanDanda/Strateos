import sinon from 'sinon';
import { expect } from 'chai';
import ajax from 'main/util/ajax';
import RunActions from './RunActions';

describe('Runs Actions', () => {
  const sandbox = sinon.createSandbox();
  afterEach(() => {
    sandbox.restore();
  });

  it('should successfully call complete instruction api', () => {
    const payload = { completed: true };
    const runId = 'r109876';
    const id = 'iabcdefg';
    const errorHandlerSpy = sandbox.spy();
    const postStub = sandbox.stub(ajax, 'post').returns({ fail: () => {} });
    RunActions.completeInstruction(runId, id, errorHandlerSpy);
    expect(postStub.calledWithExactly(`/api/runs/${runId}/instructions/${id}/complete`, payload)).to.be.true;
    expect(errorHandlerSpy.notCalled).to.be.true;
  });

  it('should call errorHandler on failed complete instruction api request', () => {
    const payload = { completed: true };
    const runId = 'r1234567';
    const id = 'i12345';
    const errorHandlerSpy = sandbox.spy();
    const postStub = sandbox.stub(ajax, 'post').returns({
      fail: (cb) => cb({ responseText: 'error' })
    });
    RunActions.completeInstruction(runId, id, errorHandlerSpy);
    expect(postStub.calledWithExactly(`/api/runs/${runId}/instructions/${id}/complete`, payload)).to.be.true;
    expect(errorHandlerSpy.calledOnce).to.be.true;
  });

});
