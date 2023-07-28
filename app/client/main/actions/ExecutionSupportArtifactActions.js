import NotificationActions from 'main/actions/NotificationActions';
import _ from 'lodash';
import ajax from 'main/util/ajax';
import RunAPI from 'main/api/RunAPI';
import Urls from 'main/util/urls';

const ExecutionSupportArtifactActions = {
  fetchExecutionSupportArtifacts(runId, instructionIds, sortKey, sortDirection, limit, offset) {
    const sortBy = sortDirection === 'desc' ? [`-${sortKey}`] : [sortKey];
    const options = {
      filters: { includes_all_instruction_ids: instructionIds.join() },
      limit: limit,
      offset: offset,
      sortBy,
      fields: { execution_support_artifacts: ['name,created_at,operation,status,presigned_url'] }
    };
    const url = RunAPI.createUrl(`/${runId}/execution_support_artifacts`, options);
    return ajax.get(url).fail((...response) => NotificationActions.handleError(...response));
  },

  regenerateExecutionSupportArtifact(runId, instructionIds, operation) {
    const payload = {
      run_id: runId,
      instruction_ids: instructionIds,
      operation: operation
    };
    return ajax
      .post(Urls.generate_execution_support_artifact(runId), payload)
      .fail((...response) => NotificationActions.handleError(...response));
  }
};

export default ExecutionSupportArtifactActions;
