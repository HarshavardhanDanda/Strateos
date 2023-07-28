import { configure, makeAutoObservable, observable, ObservableSet, reaction, runInAction, toJS } from 'mobx';
import _ from 'lodash';
import ajax from 'main/util/ajax';
import UserActions from 'main/actions/UserActions';
import RunActions from 'main/actions/RunActions';
import NotificationActions from 'main/actions/NotificationActions';
import { createApiUrl } from 'main/util/UrlGeneration';
import Urls from 'main/util/urls';
import RunFilterStore, { RunStatuses } from 'main/stores/mobx/RunFilterStore';
import LabStore, { WorkcellObject } from 'main/stores/mobx/LabStore';
import { OptionsObject, WorkcellType } from 'main/stores/mobx/types';
import ModalActions from 'main/actions/ModalActions';
import { MODAL_ID as RUN_SUBMIT_MODAL_ID } from 'main/pages/RunsPage/views/QueueView/RunSubmitModal';

// Take a slight performance hit here, but helps support more browsers
configure({
  useProxies: 'never'
});

interface Protocol {
  name: string;
  package: {
    description: string;
    id: string;
  }
}

// Only grabbed props needed at the time, expand as needed
interface Run {
  id: string;
  lab_id: string;
  status: string;
  title: string;
  total_cost: string;
  protocol_id: string;
  protocol?: Protocol;
  organization_name?: string;
  assigned_to_id?: string;
  protocol_name?: string;
}

interface Session {
  name: string;
  sessionId: string;
  disabled?: boolean;
}

export default class RunManagementStore {
  selectedRunIds: ObservableSet<string> = observable.set([]);
  viewType: RunsViewType = undefined;

  // Run Submit, maybe new store
  private _selectedSubmitWorkcellId: string = undefined;
  submitModalState: RunSubmitState = undefined;
  shouldSubmitRunsAggregated = false;
  shouldReserveSubmitDestinies = false;
  isTestSubmission = false;
  shouldAllowConstraintViolations = false;
  runSubmitTimeAllowance: string = undefined;
  maxMcxScheduleTime: string = undefined;
  workcellSessions: Array<Session> = [];
  selectedWorkcellSessionId: string = undefined;
  testSubmitSessionId: string = undefined;

  // Run Query, maybe new store
  loadingRuns = false;
  runData: Array<Run> = [];
  runsPerPage: number = undefined;
  totalRunPages: number = undefined;

  // Not observable on this store
  private runFilterStore: RunFilterStore;
  private labStore: LabStore;

  constructor(runFilterStore: RunFilterStore, labStore: LabStore) {
    makeAutoObservable(this);
    this.runFilterStore = runFilterStore;
    this.labStore = labStore;
    // Subscribing to search options to fetch new runs. See Mobx reactions docs for more info

    reaction(
      () => this.searchObject, // If this value changes -
      this.loadRuns, // Fire this -
      { fireImmediately: false, delay: 250 } // Using these options for reaction
    );
  }

  init = (viewType: RunsViewType, runStatus: RunStatuses): void => {
    this.viewType = viewType;
    this.runFilterStore.updateRunStatus(runStatus);
    this.loadRuns();
    this.clearSelectedRuns();
  };

  toggleRun = (runId: string, shouldInsert: boolean): void => {
    shouldInsert ?
      this.selectedRunIds.add(runId) :
      this.selectedRunIds.delete(runId);
  };

  openModal = (): void => {
    this.resetSubmitModalOptions();
    this.setModalOpen(true);
  };

  closeModal = (): void => {
    this.setModalOpen(false);
  };

  setModalOpen = (shouldOpen: boolean): void => {
    shouldOpen ?
      ModalActions.open(RUN_SUBMIT_MODAL_ID) :
      ModalActions.close(RUN_SUBMIT_MODAL_ID);
  };

  setSelectedSubmitWorkcellId = (workcellId?: string) => {
    this._selectedSubmitWorkcellId = workcellId;
    this.loadWorkcellSessions();
  };

  setSelectedWorkcellSessionId = (sessionId?: string) => {
    this.selectedWorkcellSessionId = sessionId;
  };

  setShouldSubmitRunsAggregated = (shouldAggregate: boolean) => {
    this.shouldSubmitRunsAggregated = shouldAggregate;
  };

  setShouldReserveSubmitDestinies = (shouldReserve: boolean) => {
    this.shouldReserveSubmitDestinies = shouldReserve;
  };

  setIsTestSubmission = (isTest: boolean) => {
    this.isTestSubmission = isTest;
  };

  setTestSubmitSessionId = (sessionId?: string) => {
    this.testSubmitSessionId = sessionId;
  };

  setShouldAllowConstraintViolations = (shouldAllow: boolean) => {
    this.shouldAllowConstraintViolations = shouldAllow;
  };

  setMaxMcxScheduleTime = (maxTime?: string) => {
    this.maxMcxScheduleTime = maxTime;
  };

  // Amino Table uses a bad object of { recordId: boolean } to represent selected records
  // we'll use the proper data structure internally though
  setSelectedRuns = (selectedRuns: object) => {
    const selectedRunIds = Object.keys(selectedRuns);
    this.selectedRunIds.replace(selectedRunIds);
  };

  clearSelectedRuns = (): void => {
    this.setSelectedRuns({});
  };

  // Amino List component has a gnarly api requiring { id: isSelected } instead of just a list/array/set of selected ids
  get aminoSelectedObject() {
    return this.selectedRunIds
      .toJSON()
      .reduce((prev, next) => {
        prev[next] = true;
        return prev;
      }, {});
  }

  // Amino hates the mobx array type
  get runs() {
    return toJS(this.runData);
  }

  get currentViewType() {
    return this.viewType;
  }

  get maxPage() {
    return this.totalRunPages ? this.totalRunPages : 0;
  }

  get selectedRuns() {
    return this.runData.filter(run => {
      return (
        this.selectedRunIds.has(run.id) &&
        (this.runFilterStore.runStatus === RunStatuses.AllRuns
          || run.status === this.runFilterStore.runStatus
          || this.runFilterStore.runStatus === this.runFilterStore.formattedRunStatus
          || this.runFilterStore.runStatus === RunStatuses.AllWithRejectedAndCancelled)
      );
    });
  }

  // Can only aggregate on runs of same protocol regardless of version, and regardless of org of the protocol
  //  currently no real way to track protocols between orgs so the best we can do is compare name (which is NOT unique)
  get selectedRunsCanAggregate() {
    const allRunsProbablyHaveSameProtocol = [...new Set(this.selectedRuns.map(run => run.protocol?.name))].length === 1;
    return this.selectedRuns.length > 1 && allRunsProbablyHaveSameProtocol;
  }

  get selectedRunLabIds() {
    return new Set(this.selectedRuns.map(run => {
      return run.lab_id;
    }));
  }

  // Auto select if there's only one available workcell for UX
  get selectedSubmitWorkcellId(): string {
    if (this.selectedRunsAvailableWorkcellOptions.length === 1) {
      return this._selectedSubmitWorkcellId || this.selectedRunsAvailableWorkcellOptions[0].value;
    } else {
      return this._selectedSubmitWorkcellId;
    }
  }

  get selectedRunsAvailableWorkcells(): Array<WorkcellObject> {
    if (this.selectedRunLabIds.size !== 1) {
      return [];
    } else {
      const labId = [...this.selectedRunLabIds][0];
      return  this.labStore.workcellsByLabId.get(labId) || [];
    }
  }

  get selectedRunsAvailableWorkcellOptions(): Array<OptionsObject> {
    const options: Array<OptionsObject> = this.selectedRunsAvailableWorkcells
      .filter(w => !w.is_test) // User experience is that test submissions go to a "normal" workcell, not the separate test workcell
      // TODO: remove this filtering once we support more than just Metamcx workcells
      .filter(workcell => workcell.workcell_type === WorkcellType.Meta)
      .map(workcell => ({
        name: workcell.name,
        value: workcell.workcell_id,
      }));
    return options;
  }

  get workcellSessionOptions(): Array<OptionsObject> {
    const options: Array<OptionsObject> = this.workcellSessions.map(session => ({
      value: session.sessionId,
      name: session.name,
      disabled: !!session.disabled
    }));
    return [NEW_SESSION_OPTION].concat(options);
  }

  get selectedSubmitWorkcellType(): WorkcellType {
    return this.selectedRunsAvailableWorkcells.find(workcell => workcell.workcell_id === this.selectedSubmitWorkcellId)?.workcell_type as WorkcellType;
  }

  get selectedSubmitWorkcellUri(): string {
    const selectedWorkcell = this.selectedRunsAvailableWorkcells.find(workcell => workcell.workcell_id === this.selectedSubmitWorkcellId);
    if (selectedWorkcell) {
      return `${window.location.origin}${Urls.operator_dashboard_deref(selectedWorkcell.id)}`;
    }

    return '';
  }

  get bulkSubmitDisabled(): boolean {
    return this.selectedRunsAvailableWorkcellOptions.length === 0;
  }

  // Pulling off of selectedRuns computed value since selectedRunIds retains selected ids for other run status views
  get selectedRunIdsArray() {
    return this.selectedRuns.map(r => r.id);
  }

  get numberRunsSelected() {
    return this.selectedRuns.length;
  }

  // TODO: original production code wasn't working, find out what actual desired logic is
  // Used to be tracked in two separate disabled checks but faulty logic resulted in them being always the same
  get allSelectedAcceptedOrInProgress() {
    return this.numberRunsSelected > 0 &&
      this.selectedRuns.every(run => [RunStatuses.Accepted.toString(), RunStatuses.InProgress.toString()].includes(run.status));
  }

  get searchObject() {
    switch (this.viewType) {
      case RunsViewType.Queue:
        return this.runFilterStore.queueSearchObject;
      case RunsViewType.Approvals:
        return this.runFilterStore.approvalsSearchObject;
      case RunsViewType.RunTransferModal:
        return this.runFilterStore.runTransferModalSearchObject;
      default:
        return undefined;
    }
  }

  get selectedRunsArray() {
    return toJS(this.selectedRuns);
  }

  /* Here be side effects */
  loadRuns = () => {
    const searchOptions = toJS(this.searchObject);
    if (searchOptions != undefined) {
      this.loadingRuns = true;
      return ajax.post(SEARCH_URL, searchOptions)
        .then((res) => {
          // I have no idea what this does, but it did so before the store change
          const userIds = res.results
            .map(r => r.assigned_to_id)
            .filter(u => u != null);

          if (!_.isEmpty(userIds)) {
            UserActions.loadUsers(userIds);
          }

          return res;
        })
        .then(({ results, num_pages, per_page }) => {
          runInAction(() => {
            this.setRuns(results, num_pages, per_page);
            this.loadingRuns = false;
          });
        });
    }
  };

  loadWorkcellSessions = async () => {
    // Only Mcx workcells have sessions
    if (this.selectedSubmitWorkcellId && this.selectedSubmitWorkcellType === WorkcellType.Mcx) {
      try {
        const { list } = await ajax.get(Urls.workcell_sessions(this.selectedSubmitWorkcellId));
        runInAction(() => {
          this.workcellSessions = list;
        });
      } catch (err) {
        console.error(`Loading Sessions for Workcell ${this.selectedSubmitWorkcellId} failed. May be able to recover by reselecting workcell.`, err);
      }
    } else {
      this.workcellSessions = [];
    }
  };

  setRuns = (runs: Array<Run>, numPages: number, runsPerPage: number) => {
    this.runData = runs;
    this.totalRunPages = numPages;
    this.runsPerPage = runsPerPage;
  };

  rejectSelectedRun = async (reason: string, description: string) => {
    const results = await Promise.allSettled(this.selectedRunIdsArray.map(id => RunActions.rejectRun(id, reason, description)));
    this.resetRuns();
    return results;
  };

  setRunsPriority = async (priority: string) => {
    const result = await RunActions.changeRunsPriority(this.selectedRunIdsArray, { priority });
    this.resetRuns();
    return result;
  };

  assignSelectedRunsToUser = async (operatorId: string) => {
    const result = await RunActions.assignRuns(this.selectedRunIdsArray, { assigned_to_id: operatorId });
    this.resetRuns();
    return result;
  };

  // Potentially slightly different permissions required to assign to self than to another
  claimSelectedRuns = async () => {
    const result = await RunActions.claimRuns(this.selectedRunIdsArray);
    // Let the user claim and then perform more actions with same selected list but update runs from server
    this.loadRuns();
    return result;
  };

  approveSelectedRuns = async (runApproveRequest) => {
    const result = await Promise.allSettled(this.selectedRunIdsArray.map(id => RunActions.runApproval(id, runApproveRequest)));
    this.loadRuns();
    return result;
  };

  bulkSubmitSelectedRuns = async () => {
    switch (this.selectedSubmitWorkcellType) {
      case WorkcellType.Meta:
        this.bulkSubmitMetaRuns();
        break;
      default:
        console.error('No valid workcell type selected, only Metamcx workcell type is currently supported for bulk submit.');
    }
  };

  private bulkSubmitMetaRuns = async () => {
    const submitBody = {
      run_ids: this.selectedRunIdsArray,
      workcell_id: this.selectedSubmitWorkcellId,
      aggregateRuns: this.shouldSubmitRunsAggregated,
    };
    this.submitModalState = RunSubmitState.Pending;

    try {
      const { schedule_requests } = await ajax.post(BULK_SUBMIT_URL, submitBody);
      const requestLookupPaths = schedule_requests.map(request => [request.run_id, request.status_query_path]);
      const pollTimeout = (new Date()).getTime() + (POLL_TIMEOUT_SECONDS * 1000);
      this.pollSubmitRequests(requestLookupPaths, pollTimeout);

    } catch (err) {
      runInAction(() => {
        this.submitModalState = RunSubmitState.Failure;
      });
      NotificationActions.handleError(err);
    }
  };

  pollSubmitRequests = async (runLookups: Array<[string, string]>, timeout: number) => {
    try {
      const results = await Promise.all(runLookups.map(([_, queryPath]) => ajax.get(queryPath)));
      const finishedStatuses = [RunSubmitResponseStatus.Success, RunSubmitResponseStatus.Failed, RunSubmitResponseStatus.Aborted].map(s => s.toString());
      if (results.every(result => finishedStatuses.includes(result.status))) {
        const allStatuses = [...new Set(results.map(r => r.status))];
        if (allStatuses.length === 1) {
          runInAction(() => {
            switch (allStatuses[0]) {
              case RunSubmitResponseStatus.Success.toString():
                this.submitModalState = RunSubmitState.Success;
                break;
              case RunSubmitResponseStatus.Failed.toString():
                this.submitModalState = RunSubmitState.Failure;
                break;
              case RunSubmitResponseStatus.Aborted.toString():
                this.submitModalState = RunSubmitState.Aborted;
                break;
            }
          });
        }
      } else if ((new Date()).getTime() < timeout) {
        setTimeout(() => this.pollSubmitRequests(runLookups, timeout), POLL_DELAY_SECONDS * 1000);
      }
    } catch (err) {
      NotificationActions.handleError(err);
    }
  };

  // Reset on modal open in case entirely different runs were selected for next modal open
  resetSubmitModalOptions = () => {
    this.setSelectedSubmitWorkcellId();
    this.setShouldSubmitRunsAggregated(false);
    if (this.submitModalState === RunSubmitState.Success) {
      this.resetRuns();
    }
    this.submitModalState = RunSubmitState.Ready;
  };

  // You mutated state on the server didn't you?? Fetch again to ensure consistency
  resetRuns = () => {
    this.clearSelectedRuns();
    this.loadRuns();
  };
}

const SEARCH_URL = createApiUrl(['runs', 'search']);
const BULK_SUBMIT_URL = '/runs/group_submit';
const NEW_SESSION_ID = 'NEW_SESSION_ID';
const NEW_SESSION_OPTION: OptionsObject = { value: NEW_SESSION_ID, name: 'Create New' };
const POLL_DELAY_SECONDS = 1;
const POLL_TIMEOUT_SECONDS = 300;

export enum RunsViewType {
  Queue,
  Approvals,
  RunTransferModal
}

export enum RunSubmitState {
  Ready,
  Success,
  Pending,
  Failure,
  Aborted,
}

enum RunSubmitResponseStatus {
  Success = 'success',
  Failed = 'failed',
  Aborted = 'aborted',
}
