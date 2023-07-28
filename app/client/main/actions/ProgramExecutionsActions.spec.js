import sinon from 'sinon';
import { expect } from 'chai';
import NotificationActions from 'main/actions/NotificationActions';
import ProgramExecutionAPI from '../api/ProgramExecutionAPI';
import ProgramExecutionsActions from './ProgramExecutionsActions';

describe('Progam Executions Actions', () => {
  const sandbox = sinon.createSandbox();

  afterEach(() => {
    if (sandbox) sandbox.restore();
  });

  it('should display notification successful trigger', () => {
    sandbox.stub(ProgramExecutionAPI, 'createAndExecutePostRunProgram').returns({
      done: (cb) => {
        cb();
        return { fail: () => ({}) };
      }
    });
    const createNotification = sandbox.stub(NotificationActions, 'createNotification');

    ProgramExecutionsActions.createAndExecutePostRunProgram('runId');
    expect(createNotification.called).to.be.true;
    expect(createNotification.args[0][0].text).to.eql('Post run program has been started , you will be notified when the program completes');
    expect(createNotification.args[1][0].text).to.eql('Post run program execution completed');
  });
});
