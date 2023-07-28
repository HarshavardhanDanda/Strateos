/* eslint-disable camelcase */
import _ from 'lodash';

import Dispatcher from 'main/dispatcher';
import HTTPUtil from 'main/util/HTTPUtil';
import ajax from 'main/util/ajax';
import NotificationActions from 'main/actions/NotificationActions';
import Urls from 'main/util/urls';
import JsonAPIIngestor from 'main/api/JsonAPIIngestor';
import RunAPI from 'main/api/RunAPI';

const RunActions = {
  load(project_id, run_id) {
    return ajax.get(Urls.run(project_id, run_id))
      .done(run => Dispatcher.dispatch({ type: 'RUN_DATA', run }));
  },

  loadRunById(run_id, data, options) {
    return HTTPUtil.get(Urls.run_by_id(run_id), { data, options })
      .done((run) => {
        Dispatcher.dispatch({ type: 'RUN_DATA', run });
      })
      .fail((...response) => NotificationActions.handleError(...response));
  },

  loadRunListById(run_id, includes, json_type) {
    const data = { json_type, include: includes };
    return HTTPUtil.get(Urls.run_by_id(run_id), { data })
      .done((run) => {
        JsonAPIIngestor.ingest(run);
      })
      .fail((...response) => NotificationActions.handleError(...response));
  },

  loadRelatedRuns(run_id, options) {
    const url = RunAPI.createUrl(`/${run_id}/get_tree`, options);

    return ajax.get(url)
      .fail((...response) => NotificationActions.handleError(...response));
  },

  loadMinimal(projectId, runId) {
    const queryString = `${Urls.run(projectId, runId)}/show_minimal`;
    return ajax.get(queryString)
      .done((run) => {
        Dispatcher.dispatch({ type: 'RUN_DATA', run });
      })
      .fail(xhr => xhr);
  },

  loadByContainer(containerId, json_type = 'short_json') {
    return ajax.get(Urls.container_runs(containerId), { json_type })
      .done(runs => Dispatcher.dispatch({ type: 'RUN_LIST', runs }));
  },

  loadClone(project_id, run_id, options) {
    return HTTPUtil.get(Urls.run_clone(project_id, run_id), { options })
      .done((data) => {
        Dispatcher.dispatch({ type: 'CONTAINER_TYPE_LIST', containerTypes: data.container_types });
        Dispatcher.dispatch({ type: 'CONTAINER_LIST', containers: data.containers });
        Dispatcher.dispatch({ type: 'ALIQUOT_LIST', aliquots: data.aliquots });
      });
  },

  loadAutoprotocol(projectId, runId) {
    const url = Urls.autoprotocol(projectId, runId);
    return HTTPUtil.get(url, {})
      .done((autoprotocol) => {
        Dispatcher.dispatch({
          type: 'RUN_DATA',
          run: _.extend({ id: runId, autoprotocol })
        });
      });
  },

  loadQuote(projectId, runId) {
    const url = Urls.run_quote(projectId, runId);

    return ajax.get(url)
      .done((quote) => {
        Dispatcher.dispatch({
          type: 'RUN_DATA',
          run: { id: runId, quote }
        });
      });
  },

  loadPreview(previewId) {
    return ajax.get(Urls.run_preview(previewId));
  },

  update(project_id, run_id, data) {
    // Eager update
    if (data.run) {
      Dispatcher.dispatch({
        type: 'RUN_DATA',
        run: _.extend({ id: run_id }, data.run)
      });
    }
    const promise = ajax.put(Urls.run(project_id, run_id), data);
    promise.done((run) => {
      Dispatcher.dispatch({
        type: 'RUN_DATA',
        run
      });
    });
    promise.fail((...response) => {
      NotificationActions.handleError(...response);
    });
    return promise;
  },

  accept(project_id, run_id) {
    return ajax.post(Urls.run_accept(project_id, run_id))
      .done(() => RunActions.load(project_id, run_id));
  },

  abort(project_id, run_id) {
    return ajax.post(Urls.run_abort(project_id, run_id), { details: 'Run aborted by operator.' })
      .done(() => {
        return RunActions.load(project_id, run_id);
      })
      .fail((...response) => NotificationActions.handleError(...response));
  },

  cancel(project_id, run_id) {
    return ajax.post(Urls.run_cancel(project_id, run_id), { details: 'User canceled run.' })
      .done(() => {
        return RunActions.load(project_id, run_id);
      })
      .fail((...response) => NotificationActions.handleError(...response));
  },

  flag(project_id, run_id) {
    const url = Urls.run_flag(project_id, run_id);
    return ajax.post(url)
      .done((run) => {
        Dispatcher.dispatch({
          type: 'RUN_DATA',
          run
        });
      })
      .fail((...response) => NotificationActions.handleError(...response));
  },

  execute(project_id, run_id) {
    return ajax.post(Urls.execute_run(project_id, run_id))
      .fail((...response) => NotificationActions.handleError(...response));
  },

  claimRuns(ids) {
    return ajax.when(...ids.map(this.claimRun));
  },

  claimRun(id) {
    return ajax.put(`/api/runs/${id}/claim`)
      .then((run) => NotificationActions.createNotification({
        text: `Run ${run.title || run.id} is claimed.`
      }))
      .fail((...response) => NotificationActions.handleError(...response));
  },

  changeRunsPriority(ids, data) {
    const runIds = ids.map(id => this.changeRunPriority(id, data));
    return ajax.when(...runIds);
  },

  changeRunPriority(id, data) {
    return ajax.put(Urls.run_priority(id), data)
      .then((run) => NotificationActions.createNotification({
        text: `Run ${run.title || run.id} priority is updated.`
      }))
      .fail((...response) => NotificationActions.handleError(...response));
  },

  assignRuns(ids, data) {
    const runIds = ids.map(id => this.assignRun(id, data));
    return ajax.when(...runIds);
  },

  assignRun(id, data) {
    return ajax.put(Urls.run_assign(id), data)
      .then((run) => NotificationActions.createNotification({
        text: `Run ${run.title || run.id} is assigned.`
      }))
      .fail((...response) => NotificationActions.handleError(...response));
  },

  runApproval(id, data, scheduleType) {
    const successMessage = scheduleType === 'schedule' ? 'Run is scheduled' : 'Run is approved';
    return ajax.put(Urls.run_approval(id), data).done(() => {
      return NotificationActions.createNotification({
        text: successMessage,
        isError: false
      });
    }).fail((...response) => NotificationActions.handleError(...response));
  },

  rejectRun(run_id, reject_reason, reject_description) {
    return ajax.put(Urls.run_reject(run_id), { reject_reason, reject_description })
      .done((run) => {
        return NotificationActions.createNotification({
          text: `Run ${run.title || run.id} is rejected`,
          isError: false
        });
      })
      .fail((...response) => NotificationActions.handleError(...response));
  },

  abortRun(run_id) {
    return ajax.put(Urls.run_abort(run_id), { aborted_reason: 'Run aborted' })
      .done((run) => {
        Dispatcher.dispatch({ type: 'RUN_DATA', run });
        return NotificationActions.createNotification({
          text: `Run ${run.title || run.id} is Aborted`,
          isError: false
        });
      })
      .fail((...response) => NotificationActions.handleError(...response));
  },

  completeInstruction: (runId, id, errorHandler) => {
    const url = Urls.complete_instruction(runId, id);
    const data = { completed: true };
    return ajax.post(url, data)
      .fail((...response) => {
        if (errorHandler) {
          errorHandler(response);
        }
        NotificationActions.handleError(...response);
      });
  },

  undoInstruction: (runId, id) => {
    return ajax.post(Urls.undo_instruction(runId, id))
      .fail((...response) => NotificationActions.handleError(...response));
  },

  getScheduleRequest: (subdomain, projectId, runId, requestId) => {
    const runUrl = `/${subdomain}/${projectId}/runs/${runId}`;
    const url = `${runUrl}/schedule_requests/${requestId}`;
    return ajax.get(url);
  },

  abortScheduleRequest: (subdomain, projectId, runId, requestId) => {
    const runUrl = `/${subdomain}/${projectId}/runs/${runId}`;
    const url = `${runUrl}/schedule_requests/${requestId}/abort`;
    return ajax.post(url).fail((...response) => NotificationActions.handleError(...response));
  },

  attachInstructionData: (instructionId, data) => {
    data.instruction_id = instructionId;
    return ajax.post(Urls.dataset_prime_directive(), data)
      .fail((...response) => NotificationActions.handleError(...response));
  },

  updateRun: (id, data) => {
    return ajax.put(Urls.run_by_id(id), data)
      .done((run) => {
        Dispatcher.dispatch({
          type: 'RUN_DATA',
          run
        });
      })
      .fail((...response) => NotificationActions.handleError(...response));
  },

  transfer(id, projectId) {
    return RunActions.updateRun(id, { project_id: projectId });
  },

  multiTransfer(ids, projectId) {
    const transfers = ids.map(id => RunActions.transfer(id, projectId));
    return ajax.when(...transfers)
      .done(() => {
        NotificationActions.createNotification({
          text: 'Successfully transfered runs.'
        });
      });
  },

  updateRunFeedback(run_id, success, success_notes) {
    return ajax.put(Urls.run_feedback(run_id), { success, success_notes })
      .done((run) => {
        Dispatcher.dispatch({
          type: 'RUN_DATA',
          run
        });
        return NotificationActions.createNotification({
          text: `Run ${run.title || run.id} Feedback submitted`,
          isError: false
        });
      })
      .fail((...response) => NotificationActions.handleError(...response));
  }
};

export default RunActions;
