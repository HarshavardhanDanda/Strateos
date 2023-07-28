import ajax from 'main/util/ajax';
import Dispatcher from 'main/dispatcher';
import NotificationActions from 'main/actions/NotificationActions';
import { getWorkflowGraphQLClient } from '../util/graphql/client';
import { WorkflowInstancesByRunIdsQueryGQL } from '../util/graphql/queries';

const baseApiPath = '/service/workflow/api/v1';

export const WorkflowActions = {
  loadDefinitions(workflow_id) {
    return ajax.get(`${baseApiPath}/workflow-definitions/${workflow_id}`)
      .done(workflowDefinition => Dispatcher.dispatch({ type: 'WORKFLOW_DEFINITION_DATA', workflowDefinition }));
  },
  loadExecutions(workflow_id) {
    return ajax.get(`${baseApiPath}/workflow-executions/${workflow_id}`)
      .done(workflowExecution => Dispatcher.dispatch({ type: 'WORKFLOW_EXECUTION_DATA', workflowExecution }));
  },
  loadInstanceByRun(run_id) {
    const variables = { runIds: [run_id] };

    return getWorkflowGraphQLClient().request({
      query: WorkflowInstancesByRunIdsQueryGQL,
      variables
    }).then(({ data, error }) => {
      if (error) {
        return Promise.reject(error);
      } else if (data.workflowInstances.items.length) {
        Dispatcher.dispatch({ type: 'WORKFLOW_EXECUTION_DATA', workflowExecution: data.workflowInstances.items[0] });
        return data.workflowInstances.items[0];
      } else {
        return {};
      }
    }).catch((error) => {
      NotificationActions.createNotification({
        isError: true,
        title: 'Workflow Instance fetch failed',
        text: (error.httpError || error.fetchError) ? 'Network failure' : 'Something went wrong!'
      });
    }
    );
  }
};
