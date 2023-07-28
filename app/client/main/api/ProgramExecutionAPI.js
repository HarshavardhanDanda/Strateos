import ajax    from 'main/util/ajax';
import Urls from '../util/urls';
import API     from './API';

class ProgramExecutionAPI extends API {
  constructor() {
    super('program_executions');
  }

  createAndExecutePostRunProgram(runId) {
    return ajax.post(Urls.create_and_execute_post_run_program(), { run_id: runId });
  }

}

export default new ProgramExecutionAPI();
