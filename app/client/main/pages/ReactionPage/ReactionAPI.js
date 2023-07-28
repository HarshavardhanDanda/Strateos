import ajax from 'main/util/ajax';
import _ from 'lodash';
import Dispatcher from 'main/dispatcher';
import RunActions from 'main/actions/RunActions';
import NotificationActions from 'main/actions/NotificationActions';

// Valid statues for the Reaction object on `status` field
const statuses = {
  // The reaction has been persisted to the system
  CREATED: 'CREATED',
  // A request has been submitted to create a run from this reaction
  SUBMITTED: 'SUBMITTED',
  // A run has been created from this reaction
  RUN_CREATED: 'RUN_CREATED',
  // Errors were encountered while trying to generate a run for this reaction
  SUBMITTED_WITH_ERRORS: 'SUBMITTED_WITH_ERRORS'
};

// Statuses that indicate we have finished with submitting a Run, whether successful or not
const FINISHED_RUN_SUBMISSION_STATUSES = [statuses.RUN_CREATED, statuses.SUBMITTED_WITH_ERRORS];

// this api is not a json-api
export class ReactionAPI {
  constructor() {
    this.resourceName = 'v1/reactions';
  }

  createUrl(path) {
    return `/api/${this.resourceName}${path}`;
  }

  get(id) {
    const url = this.createUrl(`/${id}`);
    return ajax.get(url);
  }

  getReactions(run_id) {
    const url = this.createUrl(`?run_id=${run_id}`);
    return ajax.get(url);
  }

  getReactionsByIds(ids, loadRuns = false) {
    const chunkedReactionIds = ids.length > 0 && _.chunk(ids, 12);
    chunkedReactionIds.forEach((reactionIds) => {
      const url = this.createUrl(`?ids=${reactionIds.join()}`);
      return ajax.get(url)
        .done(response => {
          loadRuns && response && response.reactions.forEach((record) => {
            const runId = record.runId;
            const data = { 'fields[runs]': 'status' };
            runId && RunActions.loadRunById(runId, data);
          });
          Dispatcher.dispatch({
            type: 'REACTIONS_API_LIST',
            entities: response.reactions
          });
          response.errors && response.errors.forEach(error => NotificationActions.handleError('', '', error.message));
        })
        .fail((...response) => NotificationActions.handleError(...response));
    });
  }

  createRun(id) {
    const url = this.createUrl(`/${id}/submit`);
    return ajax.post(url, {});
  }

  runSubmissionIsDone(reactionPayload) {
    const { status } = reactionPayload;
    const isDone = FINISHED_RUN_SUBMISSION_STATUSES.includes(status);
    return isDone;
  }

  pollForRun(id) {
    const makeRequest = () => {
      return this.get(id)
        .then((reaction) => {
          // The return value here is the predicate for ajax.poll
          return this.runSubmissionIsDone(reaction);
        });
    };

    const maxWait = 180000; // 3 min just to be safe for the demo
    const pollInterval = 1000; // 1 sec
    return ajax.poll(makeRequest, pollInterval, maxWait);
  }

  updateProject(id, requestData) {
    return ajax.patch(this.createUrl(`/${id}`), requestData);
  }

  updateReactant(reactionId, reactantId, requestData) {
    return ajax.patch(this.createUrl(`/${reactionId}/reactants/${reactantId}`), requestData);
  }
}

export default new ReactionAPI();
