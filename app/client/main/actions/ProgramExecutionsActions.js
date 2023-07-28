import NotificationActions from 'main/actions/NotificationActions';
import ProgramExecutionAPI from '../api/ProgramExecutionAPI';

const ProgramExecutionsActions = {
  createAndExecutePostRunProgram(runId) {
    NotificationActions.createNotification({ text: 'Post run program has been started , you will be notified when the program completes', isInfo: true });
    return ProgramExecutionAPI.createAndExecutePostRunProgram(runId)
      .done(() => {
        NotificationActions.createNotification({ text: 'Post run program execution completed' });
      })
      .fail((...args) => NotificationActions.handleError(...args));
  }
};

export default ProgramExecutionsActions;
