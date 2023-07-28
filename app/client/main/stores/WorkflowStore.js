/* eslint-disable consistent-return, no-underscore-dangle */
import _ from 'lodash';

import Dispatcher from 'main/dispatcher';
import CRUDStore  from 'main/util/CRUDStore';

const WorkflowStore = _.extend({}, CRUDStore('workflow'), {
  act(action) {
    switch (action.type) {
      case 'WORKFLOW_DEFINITION_DATA':
        return this._receiveData([action.workflowDefinition]);

      case 'WORKFLOW_EXECUTION_DATA':
        return this._receiveData([action.workflowExecution]);

      default:
    }
  },

  getInstanceByRunId(runId) {
    const instance =  this.getAll().find(instance => instance.get('firstRunId') === runId);
    if (instance) {
      return instance.toJS();
    }
    return undefined;
  }
});

WorkflowStore._register(Dispatcher);

export default WorkflowStore;
