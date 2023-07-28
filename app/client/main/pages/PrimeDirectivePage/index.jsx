import Immutable from 'immutable';
import PropTypes from 'prop-types';
import Moment from 'moment';
import classnames  from 'classnames';
import { inflect } from 'inflection';
import _           from 'lodash';
import React       from 'react';

import { Page, Spinner, Button, ButtonGroup, Drawer, Profile, Banner } from '@transcriptic/amino';

import { PageLayout, PageHeader } from 'main/components/PageLayout';
import ModalActions from 'main/actions/ModalActions';
import NotificationActions from 'main/actions/NotificationActions';
import UserActions from 'main/actions/UserActions';
import DrawerActions from 'main/actions/DrawerActions';
import ProvisionSpecActions from 'main/actions/ProvisionSpecActions';
import UserRunActions from 'main/actions/RunActions';
import GroupedInstructions from 'main/lab/PrimeDirective/GroupedInstructions';
import ProvisionPanel from 'main/lab/PrimeDirective/ProvisionPanel';
import RefsPanel from 'main/lab/PrimeDirective/RefsPanel';
import ResourceAPI from 'main/api/ResourceAPI';
import WorkcellActions from 'main/actions/WorkcellActions';
import WorkcellStore from 'main/stores/WorkcellStore';
import { SinglePaneModal } from 'main/components/Modal';
import SendToWorkcellDrawer from 'main/components/SendToWorkcellDrawer';
import RunDependencies from 'main/components/RunDependencies';
import RunStatusLabel from 'main/components/RunStatusLabel';
import WarningsModal from 'main/components/WarningsModal';
import BSLLabel from 'main/components/bsl/BSLLabel';
import { TabLayout } from 'main/components/TabLayout';
import ConnectToStores from 'main/containers/ConnectToStoresHOC';
import WorkcellUtils from 'main/pages/PrimeDirectivePage/WorkcellUtils';
import ImmutableUtil from 'main/util/ImmutableUtil';
import CommonUiUtil from 'main/util/CommonUiUtil';
import FileUtil from 'main/util/FileUtil';
import { groupInstructions, getInstructionCompleteStatus } from 'main/util/InstructionUtil';
import { buildTimeConstraintsObject } from 'main/util/TimeConstraintUtil';
import ProvisionSpecStore from 'main/stores/ProvisionSpecStore';
import RunStore from 'main/stores/RunStore';
import ajax from 'main/util/ajax';
import Urls from 'main/util/urls';
import ScheduleModal from 'main/pages/RunsPage/views/ApprovalsView/ApprovalModal.jsx';
import DrawerStore from 'main/stores/DrawerStore';
import RunBreadCrumbs from 'main/pages/PrimeDirectivePage/components/RunBreadCrumbs';
import AcsControls from 'main/util/AcsControls';
import FeatureConstants from '@strateos/features';
import UserStore from 'main/stores/UserStore';
import FeatureStore from 'main/stores/FeatureStore';
import ImplementationProjectIndicator from 'main/components/ImplementationProjectIndicator';
import AutoProvisionPanel from './AutoProvisionPanel';
import './PrimeDirectivePage.scss';
import ExportCSVModal from './ExportCSVModal';

const RUN_SCHEDULED_MODAL = 'RUN_SCHEDULED_MODAL';

class PrimeDirective extends React.Component {
  static get propTypes() {
    return {
      runId:              PropTypes.string,
      run:                PropTypes.instanceOf(Immutable.Map),
      provisionSpecs:     PropTypes.instanceOf(Immutable.Iterable),
      refsPanelOpen:      PropTypes.bool,
      provisionPanelOpen: PropTypes.bool,
      drawerOpen:         PropTypes.bool,
      drawerHeight:       PropTypes.number,
      workcells:          PropTypes.instanceOf(Immutable.Iterable)
    };
  }

  static get defaultProps() {
    return {
      refsPanelOpen:      false,
      provisionPanelOpen: false
    };
  }

  constructor(props) {
    super(props);
    this.state = {
      selected: {},
      humanExecuted: {},
      lastSelected: undefined,
      workcellId: '',
      selectedSessionId: null,
      returnedSessionId: null,
      maxScheduleTime: '120:second',
      warnings: {},
      schedulerStats: {},
      instructionGroups: undefined,
      suggestingTimeConstraints: false,
      reserveDestinies: false,
      isTestSubmission: false,
      /*
      The state of prime directive
      ready: Ready to submit instructions to the workcell
      requesting: Requesting some instructions to be sent to the workcell
      waiting: Waiting some small delay before starting scheduling
      scheduling: Waiting for a schedule to be produced
      aborting: Cancelling a request to schedule
      */
      state: 'ready',
      failureCode: undefined,
      sessions: [],
      isMarkAllCompleteInProgress: false,
      completionSnapshot: {}
    };

    this.complete = this.complete.bind(this);
    this.undo = this.undo.bind(this);
    this.selectForWorkcell = this.selectForWorkcell.bind(this);
    this.updateInstruction = this.updateInstruction.bind(this);
    this.isHuman = this.isHuman.bind(this);
    this.toggleHuman = this.toggleHuman.bind(this);
    this.selectAll = this.selectAll.bind(this);
    this.abortSchedule = this.abortSchedule.bind(this);
    this.onRunSchedule = this.onRunSchedule.bind(this);
    this.getWorkcellChoices = this.getWorkcellChoices.bind(this);
    this.onCompleteAllInstructions = this.onCompleteAllInstructions.bind(this);
  }

  componentDidMount() {
    this.pollQ = ajax.singly();
    ProvisionSpecActions.loadAll(this.props.runId);
    this.fetchRun();
    this.fetchScheduleStats();
  }

  componentDidUpdate(prevProp, prevState) {
    const completionSnapshot = this.getCompletionSnapshot();
    // mark all instructions operation is completed when index of last completed is the last one of all the instructions
    const isAllCompleted = completionSnapshot.totalNumberOfInstructions === completionSnapshot.lastCompletedIndex + 1;

    if (this.state.isMarkAllCompleteInProgress &&
      !_.isEqual(completionSnapshot, prevState.completionSnapshot)
    ) {
      this.setState({
        isMarkAllCompleteInProgress: !isAllCompleted,
        completionSnapshot
      });
      if (isAllCompleted) {
        NotificationActions.createNotification({
          text: 'All instructions marked completed.'
        });
      }
    }
  }

  componentWillUnmount() {
    if (this.fetchScheduleStatsTimeoutId) {
      clearTimeout(this.fetchScheduleStatsTimeoutId);
    }
  }

  fetchWorkcells() {
    const labId = this.state.run.get('lab_id');
    if (labId !== null && FeatureStore.hasFeatureInLab(FeatureConstants.VIEW_DEVICES, labId)) {
      WorkcellActions.loadWorkcellsByLabId(labId);
    }
  }

  isSchedulingEnabled() {
    const  runStatus  = this.state.run.get('status');

    return AcsControls.isFeatureEnabled(FeatureConstants.RUN_STATE_MGMT) &&
     AcsControls.isFeatureEnabled(FeatureConstants.RESERVE_DEVICE_FOR_EXECUTION) &&
     (runStatus === 'in_progress' || runStatus === 'accepted');

  }

  listActions() {

    return [{
      icon: 'fa fa-calendar-alt',
      text: 'Schedule run',
      onClick: () => { ModalActions.open(ScheduleModal.MODAL_ID); }
    }];
  }

  onRunSchedule(runScheduleRequest) {
    const { run } = this.state;
    if (run) {
      const scheduledStartDate = runScheduleRequest.run_schedule.schedule_start_date;
      const newRun = run.set('scheduled_to_start_at', scheduledStartDate ? scheduledStartDate.toISOString() : null);
      this.setState({ run: newRun });
      UserRunActions.runApproval(run.get('id'), runScheduleRequest, 'schedule');
    }
  }

  getProvisionSpecs() {
    // TODO: We are using ProvisionSpecs for dispense as well since dispense
    // and provision are similar.  We should probably change the name.
    return this.props.provisionSpecs;
  }

  setSelectAllState() {
    const newSelectedState = _.clone(this.state.selected);

    const selected = this.numSelected() === 0;

    this.instructions().forEach((instruction) => {
      if ((instruction.get('completed_at') == undefined)) {
        newSelectedState[instruction.get('sequence_no')] = selected;
      }
    });

    return newSelectedState;
  }

  selectedWorkcellPath() {
    const { workcellId, isTestSubmission, returnedSessionId } = this.state;
    return WorkcellUtils.createWorkcellPath(workcellId, this.props.workcells, isTestSubmission, returnedSessionId);
  }

  runUrl() {
    const run = this.state.run;
    const { subTab, runStatus } = this.props;

    return Urls.runspage_details(run.get('id'), subTab, runStatus);
  }

  fetchRunAssociations() {
    const resourceIds = this.instructionResourceIds();
    if (resourceIds.length > 0) ResourceAPI.getMany(resourceIds);
  }

  getNonCompletedInstructionsCount() {
    return this.instructions().filter((instruction) =>  instruction.get('completed_at') == undefined).size;
  }

  // TODO[scott] Don't setState here.  Get the run from the RunStore and create a model on each render.
  fetchRun() {
    this.setState({ failureCode: undefined }, () => {
      const data = { json_type: 'admin_full_json' };
      const promise = UserRunActions.loadRunById(this.props.runId, data);
      promise.then((run) => {
        const immutableRun = run ? Immutable.fromJS(run) : undefined;
        if (immutableRun && immutableRun.get('assigned_to_id')) {
          UserActions.load(immutableRun.get('assigned_to_id'));
        }

        if (run) {
          buildTimeConstraintsObject(run.instructions, run.time_constraints);
        }

        this.setState({
          run: immutableRun,
          instructionGroups: groupInstructions(immutableRun.get('instructions'))
        }, this.fetchRunAssociations);
        if (immutableRun) {
          this.fetchWorkcells();
        }
      });
      promise.fail((error) => {
        this.setState({ failureCode: error.status });
      });
    });
  }

  fetchScheduleStats() {
    UserActions.getSchedulerStats()
      .done((data) => {
        this.fetchScheduleStatsTimeoutId = setTimeout(() => this.fetchScheduleStats(), 10000);
        // Check equality so we don't re-render. For large runs, react re-render is very costly.
        if (!_.isEqual(this.state.schedulerStats, data)) {
          this.setState({ schedulerStats: data });
        }
      });
  }

  instructions() {
    return this.state.run.get('instructions');
  }

  abortSchedule(postAbortCallback) {
    if (!this.state.scheduleRequest) return;
    this.setState({ state: 'aborting' });

    UserRunActions.abortScheduleRequest(
      this.state.run.getIn(['project', 'organization', 'subdomain']),
      this.state.run.getIn(['project', 'id']),
      this.state.run.get('id'),
      this.state.scheduleRequest.id
    ).done(() => alert('Successfully aborted')
    ).fail(() => alert('Failed to abort schedule')
    ).always(() => {
      if (this.state.scheduleDelayIntervalID) clearInterval(this.state.scheduleDelayIntervalID);
      if (postAbortCallback) {
        postAbortCallback();
      }

      this.setState({
        scheduleDelay: undefined,
        scheduleRequest: undefined,
        scheduleDelayIntervalID: undefined,
        state: 'ready'
      });
    });
  }

  provisionInstructions() {
    return this.instructions().filter((inst) => {
      return inst.getIn(['operation', 'op']) === 'provision';
    });
  }

  // Provision instructions which consist of `volume` measurement modes
  volumeProvisionInstructions() {
    return this.provisionInstructions().filter((provision) => {
      const measurement_mode = provision.getIn(['operation', 'measurement_mode']);
      // If measurement_mode is unspecified, that defaults to volume currently
      return measurement_mode === undefined || measurement_mode === 'volume';
    });
  }

  dispenseInstructionsUsingResourceIds() {
    // TODO: the old version (without resource_ids) should be deprecated.
    return this.instructions().filter((inst) => {
      return inst.getIn(['operation', 'op']) === 'dispense' && inst.getIn(['operation', 'resource_id']);
    });
  }

  instructionResourceIds() {
    // all resources used in a run.
    const insts = this.provisionInstructions().concat(this.dispenseInstructionsUsingResourceIds());
    return _.uniq(insts.map(inst => inst.getIn(['operation', 'resource_id'])));
  }

  updateInstruction(instruction) {
    const prevInst = this.state.run.getIn(['instructions', instruction.sequence_no], Immutable.fromJS(instruction));
    let newRun     = this.state.run.setIn(['instructions', instruction.sequence_no], Immutable.fromJS(instruction));

    // HACK to allow MeasureDataUploader, FlowAnalyzeUploader, InstructionDataUpload
    // to update the run with the newly created dataset
    if (instruction.dataset) {
      // remove previous dataset by instruction
      let datasets = newRun.get('datasets').filter(d => d.get('instruction_id') !== instruction.id);
      datasets     = datasets.push(Immutable.fromJS(instruction.dataset));
      newRun       = newRun.set('datasets', datasets);
    }

    // Handle case where dataset is removed from instruction
    if (prevInst.get('dataset') && !instruction.dataset) {
      // remove previous dataset by instruction
      const datasets = newRun.get('datasets').filter(d => d.get('instruction_id') !== instruction.id);
      newRun         = newRun.set('datasets', datasets);
    }
    return this.setState({
      run: newRun,
      instructionGroups: groupInstructions(newRun.get('instructions'))
    });
  }

  complete(instructionId) {
    return UserRunActions.completeInstruction(this.state.run.get('id'), instructionId, error => {
      if (error) {
        console.error(error);
      }
      this.setState({ isMarkAllCompleteInProgress: false });
    })
      .done(this.updateInstruction);
  }

  undo(instructionId) {
    return UserRunActions.undoInstruction(this.state.run.get('id'), instructionId)
      .done(this.updateInstruction);
  }

  getCompletionSnapshot() {
    const instructions = getInstructionCompleteStatus(this.state.instructionGroups);
    const completionSnapshot = {
      totalNumberOfInstructions: instructions.length,
      lastCompleted: '',
      lastCompletedIndex: -1,
      nextToComplete: ''
    };

    instructions.find((instruction, index) => {
      if (instruction.completed_at) {
        completionSnapshot.lastCompleted = instruction.id;
        completionSnapshot.lastCompletedIndex = index;
        return false;
      } else {
        completionSnapshot.nextToComplete = instruction.id;
        return true;
      }
    });
    return completionSnapshot;
  }

  completeAll() {
    NotificationActions.createNotification({
      text: 'Complete all instructions started, please wait...'
    });
    this.setState({
      isMarkAllCompleteInProgress: true,
      completionSnapshot: this.getCompletionSnapshot()
    });
  }

  onCompleteAllInstructions() {
    if (!CommonUiUtil.confirmWithUser('Are you sure you want to mark all instructions in this run as complete?')) {
      return;
    }
    this.completeAll();
  }

  numSelected() {
    let num = 0;
    Object.keys(this.state.selected).forEach((k) => {
      const v = this.state.selected[k];
      if (v) num += 1;
    });

    return num;
  }

  selectAll() {
    const newSelectedState = this.setSelectAllState();
    this.conditionallySetDrawerStore(this.state.selected, newSelectedState);

    this.setState({ selected: newSelectedState });
  }

  conditionallySetDrawerStore(currentSelected, nextSelected) {
    if (_.isEmpty(currentSelected) && !_.isEmpty(nextSelected)) {
      DrawerActions.open();
    // If the last instruction has just been unselected, set the workcell drawer to closed in global state
    } else if (_.isEmpty(nextSelected) && !_.isEmpty(currentSelected)) {
      DrawerActions.close();
    }
  }

  selectForWorkcell(ins, ev) {
    const sequence_no = ins.get('sequence_no');
    const selected = !this.state.selected[sequence_no];

    const changes = { [sequence_no]: selected };

    if (ev.shiftKey && this.state.lastSelected != undefined) {
      const from = Math.min(sequence_no, this.state.lastSelected);
      const to = Math.max(sequence_no, this.state.lastSelected);

      const instructionBySequenceNo = ImmutableUtil.indexBy(this.instructions(), 'sequence_no');

      for (let seq_no = from; seq_no < to; seq_no += 1) {
        changes[seq_no] = instructionBySequenceNo.get(seq_no).get('completed_at') ? false : selected;
      }
    }

    this.setState((state) => {
      const selectedCloned = _.cloneDeep(state.selected);
      const newSelected = { ...selectedCloned, ...changes };
      this.conditionallySetDrawerStore(state.selected, newSelected);
      return {
        selected: newSelected,
        lastSelected: sequence_no
      };
    });
  }

  toggleHuman(ins, ev) {
    const sequence_no = ins.get('sequence_no');
    const humanExecuted = !this.isHuman(ins);
    this.state.humanExecuted[sequence_no] = humanExecuted;
    if (ev.shiftKey && this.state.lastSelected) {
      const from = Math.min(sequence_no, this.state.lastSelected);
      const to = Math.max(sequence_no, this.state.lastSelected);
      for (let i = from, end = to, asc = from <= end; asc ? i <= end : i >= end; asc ? i += 1 : i -= 1) {
        this.state.humanExecuted[i] = humanExecuted;
      }
    }

    return this.setState({
      humanExecuted: this.state.humanExecuted,
      lastSelected: sequence_no
    });
  }

  isHuman(ins) {
    const current_state = this.state.humanExecuted[ins.get('sequence_no')];
    const protocol_specification = ins.getIn(['operation', 'x_human']);
    if (current_state != undefined) {
      return current_state;
    } else if (protocol_specification != undefined) {
      return protocol_specification;
    } else {
      return ins.get('is_human_by_default');
    }
  }

  makeScheduleRequest(
    workcellId,
    maxScheduleTime,
    force,
    timeConstraintsAreSuggestions,
    isTestSubmission,
    reserveDestinies,
    selectedSessionId
  ) {
    const workcell = WorkcellStore.getByWorkcellId(workcellId);
    const instructions = this.instructions().filter(ins => this.state.selected[ins.get('sequence_no')]);
    this.setState({ state: 'requesting' });
    const session_id = isTestSubmission && selectedSessionId !== 'new' ? selectedSessionId : null;
    const run = this.state.run;
    const { subdomain } = this.props;
    const url = `/${subdomain}/${run.getIn(['project', 'id'])}/runs/${run.get('id')}`;
    const request = ajax.post(`${url}/send_to_workcell`, {
      subrun: {
        instruction_idxs: instructions.map(c => c.get('sequence_no'))
      },
      is_test_submission: isTestSubmission,
      x_human: instructions.filter(ins => this.isHuman(ins)).map(ins => ins.get('sequence_no')),
      workcell: workcellId,
      max_schedule_time: maxScheduleTime,
      time_constraints_are_suggestions: timeConstraintsAreSuggestions,
      reserve_destinies: reserveDestinies,
      force,
      session_id,
      service_url: workcell.get('url')
    });

    return request;
  }

  sendToWorkcell(
    workcellId,
    maxScheduleTime,
    force,
    timeConstraintsAreSuggestions,
    postRequestCallback,
    selectedSessionId,
    isTestSubmission = false,
    reserveDestinies = false
  ) {

    return this.makeScheduleRequest(
      workcellId,
      maxScheduleTime,
      force,
      timeConstraintsAreSuggestions,
      isTestSubmission,
      reserveDestinies,
      selectedSessionId
    ).done((resp, status, xhr) => {

      const workcell = WorkcellStore.getByWorkcellId(workcellId);

      if (workcell.get('workcell_type') === 'integration') {
        const regexGetFilename = /[^;]*;[ ]?filename=(?<filename>[^;]*)(;)?.*/g;
        const contentDisposition = xhr.getResponseHeader('content-disposition');
        const filename = JSON.parse(regexGetFilename.exec(contentDisposition).groups.filename);
        const blob = FileUtil.base64ToBlob(resp, filename, 'zip');
        FileUtil.downloadBlob(blob, filename);
        this.setState({ state: 'ready' });
      } else {

        const { schedule_delay, schedule_request } = resp;

        // Take off one second for two network round trips
        let delay = schedule_delay;

        delay -= 1;

        this.monitorScheduleRequest(schedule_request);

        this.setState({ scheduleRequest: schedule_request, scheduleDelay: delay });

        this.updateSessions(workcellId);

        // Schedule delay is the number of seconds until we start scheduling, allowing users
        // some time to cancel the scheduling
        if (delay > 0) {

          this.setState({ state: 'waiting' });
          const timerStartedAt = Date.now();
          const scheduleDelayIntervalID = setInterval(
            () => {
              const remainingDelay = Math.max(0, Math.ceil(delay - ((Date.now() - timerStartedAt) / 1000)));

              if (remainingDelay === 0) {
                clearInterval(scheduleDelayIntervalID);

                this.setState({
                  scheduleDelayIntervalID: undefined,
                  state: (this.state.state === 'ready') ? 'ready' : 'scheduling'
                });
              }

              return this.setState({ scheduleDelay: remainingDelay });
            },
            1000
          );

          return this.setState({ scheduleDelayIntervalID });
        } else {
          return this.setState({ state: 'scheduling' });
        }
      }
    }).fail((xhr, status, text) => {
      const warnings = xhr.responseJSON ? xhr.responseJSON.warnings : undefined;

      if (warnings) {

        return this.setState({ state: 'ready', warnings }, () => ModalActions.open('WarningsModal'));
      } else {
        NotificationActions.handleError(xhr, status, text);

        return this.setState({ state: 'ready' });
      }
    }).always(() => {
      if (postRequestCallback) {
        postRequestCallback();
      }
    });
  }

  monitorScheduleRequest(req) {
    this.pollIvl = setInterval((() => this.pollScheduleJob(req)), 1000);
  }

  pollScheduleJob(req) {
    return this.pollQ((done) => {
      return UserRunActions.getScheduleRequest(
        this.state.run.getIn(['project', 'organization', 'subdomain']),
        this.state.run.getIn(['project', 'id']),
        this.state.run.get('id'),
        req.id
      ).done((data) => {
        if (data.status === 'success' || data.status === 'failed' || data.status === 'aborted') {
          clearInterval(this.pollIvl);

          const returnedSessionId = data.result ? data.result.sessionId : undefined;

          this.setState({ state: 'ready', returnedSessionId }, () => {
            switch (data.status) {
              case 'failed':
                return alert(`Failed to schedule: ${data.result.message}`);
              case 'success':
                return ModalActions.open(RUN_SCHEDULED_MODAL);
              default:
                return undefined;
            }
          });
        }
        return undefined;
      }).always(done);
    });
  }

  shouldShowWorkcellChoice(workcell) {
    return workcell.workcell_type !== 'integration';
  }

  // show tempo workcell when all instructions are selected
  getWorkcellChoices() {
    const haveAllInstSelected = this.numSelected() === this.getNonCompletedInstructionsCount();
    if (haveAllInstSelected) {
      return WorkcellUtils.workcellChoices(this.props.workcells);
    } else {
      return WorkcellUtils.workcellChoices(this.props.workcells, this.shouldShowWorkcellChoice);
    }
  }

  inboundContainers() {
    const refs = (this.state.run.get('refs') ? this.state.run.get('refs') : undefined) || [];
    return refs.filter(ref => ref.getIn(['container', 'status']) === 'inbound');
  }

  async updateSessions(workcellId) {
    try {
      const res = await ajax.get(Urls.workcell_sessions(workcellId));
      this.setState({ sessions: res.list });
    } catch (e) {
      console.error(e);
    }
  }

  renderMain() {

    // check if any non test workcells are available
    const workcellsAvailable = this.props.workcells
      .filter(w => w.get('is_test') !== true)
      .count() > 0;
    const canManageInstructions = AcsControls.isFeatureEnabled(
      FeatureConstants.SUBMIT_INSTRUCTIONS_TO_EXECUTE
    ) && this.state.instructionGroups.size > 0;

    const unmet_requirements = this.state.run.get('unrealized_input_containers').count();
    const runTitle = this.state.run.get('title') || `Run ${this.state.run.get('id')}`;

    // fetch outside of loop as toJS() is called heavily.
    const cachedProvisionSpecs = this.getProvisionSpecs();

    const blockClass = 'tx-stack__block tx-stack__block--sm';
    const blockClassSeparateActions = 'tx-stack__block tx-stack__block--xxlg';

    const marginBottom = this.props.drawerOpen ? this.props.drawerHeight : 0;

    const selectedWorkcellPath = this.selectedWorkcellPath();
    const user = UserStore.getById(this.state.run.get('assigned_to_id'));
    const instructionsWithESA = this.state.run.get('instructions').filter(i => i.get('generates_execution_support_artifacts'));
    const canExportCSV = !!instructionsWithESA.size;
    const isImplementationProject = this.state.run.getIn(['project', 'is_implementation']);

    return (
      <PageLayout
        PageHeader={(
          <PageHeader
            titleArea={(
              <RunBreadCrumbs
                runTitle={runTitle}
                subTab={this.props.subTab}
                runStatus={this.props.runStatus}
                subdomain={this.props.subdomain}
              />
            )}
            primaryInfoArea={(
              <div className="prime-directive-header__actions tx-inline tx-inline--sm">
                <div className="prime-directive-header__status-label">
                  <RunStatusLabel run={this.state.run} />
                </div>
                {isImplementationProject && (
                  <ImplementationProjectIndicator
                    organizationName={this.state.run.getIn(['project', 'organization', 'name'])}
                  />
                )}
                <Button to={this.runUrl()} link invert type="secondary">View run</Button>
              </div>
            )}
            actions={this.isSchedulingEnabled() && this.listActions()}
            type={isImplementationProject ? 'brand' : 'primary'}
          />
        )}
        theme="gray"
      >
        <TabLayout>
          {
            !this.state.run.get('scheduled_to_start_at') && this.isSchedulingEnabled() && (
              <div className="zero-schedule tx-stack">
                <Banner
                  bannerType="info"
                  bannerTitle="This run does not have a scheduled date"
                  bannerActionText="Schedule"
                  bannerAction={() => ModalActions.open(ScheduleModal.MODAL_ID)}
                />
              </div>
            )
          }

          <div
            className="prime-directive-container tx-stack"
            style={{ marginBottom }}
          >
            <div
              className={classnames(
                'prime-directive-container__actions-container',
                'run-execution__statuses',
                'tx-inline',
                'tx-inline--sm',
                blockClass
              )}
            >
              <If condition={this.state.run.get('assigned_to_id')}>
                <div className="prime-directive-container__run-schedule">
                  <span>
                    {' '}
                    <p className="tx-type--disabled prime-directive-container__assign">
                      Assigned to
                    </p>{' '}
                  </span>{' '}
                  &nbsp; &nbsp;
                  <Profile
                    imgSrc={user && user.get('profile_img_url')}
                    name={user && user.get('name')}
                    showDetails
                  />
                </div>
              </If>

              <If condition={this.state.run.get('scheduled_to_start_at')}>
                <div className="prime-directive-container__run-schedule">
                  <i className="far fa-calendar-alt fa-lg" /> &nbsp; &nbsp;
                  <span>
                    <p>
                      Scheduled for{' '}
                      {Moment(this.state.run.get('scheduled_to_start_at')).format(
                        'MMMM Do YYYY, hh:mm A'
                      )}{' '}
                    </p>{' '}
                  </span>
                </div>
              </If>

              <If condition={this.inboundContainers().size > 0}>
                <span className="prime-directive-container__run-schedule label label-danger">
                  Waiting on containers
                </span>
              </If>
              <If condition={!this.state.run.get('billing_valid?')}>
                <span className="prime-directive-container__run-schedule label label-danger">
                  No Payment Method
                </span>
              </If>
              <If condition={unmet_requirements > 0}>
                <span className="prime-directive-container__run-schedule label label-danger">
                  {`Awaiting ${unmet_requirements} generated ${inflect(
                    'container',
                    unmet_requirements
                  )}`}
                </span>
              </If>

              <BSLLabel bsl={this.state.run.get('bsl')} />
            </div>
            <If
              condition={
                unmet_requirements > 0 ||
                this.state.run.get('dependents').count() > 0
              }
            >
              <div className={blockClass}>
                <RunDependencies run={this.props.run} />
              </div>
            </If>
            {/* Provision and auto-provision panels only apply for volume provisions at the moment */}
            <If condition={this.provisionInstructions().count() > 0}>
              <div className={blockClass}>
                <ProvisionPanel
                  provisionInstructions={this.provisionInstructions()}
                  initiallyCollapsed={!this.props.provisionPanelOpen}
                />
              </div>
              <div className={blockClass}>
                <AutoProvisionPanel
                  provisionInstructions={this.provisionInstructions()}
                  refs={this.state.run.get('refs')}
                />
              </div>
            </If>
            <div className={blockClassSeparateActions}>
              <RefsPanel
                run={this.state.run}
                initiallyCollapsed={!this.props.refsPanelOpen}
                onRunChange={(run) => {
                  return this.setState({
                    run,
                    instructionGroups: groupInstructions(run.get('instructions'))
                  });
                }}
              />
            </div>
            {canManageInstructions && (
              <div
                className={classnames(
                  'prime-directive-container__actions-container',
                  blockClass
                )}
              >
                <ButtonGroup orientation="horizontal">
                  <Button
                    type="default"
                    size="medium"
                    height="short"
                    active={this.state.allowManual || !workcellsAvailable}
                    icon="fa fa-user"
                    onClick={
                      workcellsAvailable
                        ? () => {
                          this.setState({
                            allowManual: !this.state.allowManual
                          });
                        }
                        : () => { }
                    }
                  >
                    Allow Manual
                  </Button>
                  {workcellsAvailable && (
                    <Button
                      type="default"
                      size="medium"
                      height="short"
                      icon="fa fa-cog"
                      onClick={this.selectAll}
                    >
                      {`Select ${this.numSelected() > 0 ? 'None' : 'All'}`}
                    </Button>
                  )}
                  <Button
                    type="default"
                    size="medium"
                    height="short"
                    disabled={!this.state.allowManual || this.state.isMarkAllCompleteInProgress}
                    icon="fa fa-check"
                    onClick={this.onCompleteAllInstructions}
                  >
                    Mark all complete
                  </Button>
                  <Button
                    type="default"
                    size="medium"
                    height="short"
                    icon="fa fa-file-export"
                    onClick={() => ModalActions.open(ExportCSVModal.MODAL_ID)}
                    disabled={!canExportCSV}
                  >
                    Export csv
                  </Button>
                </ButtonGroup>
              </div>
            )}
            <GroupedInstructions
              key="grouped-instructions"
              run={this.state.run}
              instructionGroups={this.state.instructionGroups}
              allowManual={this.state.allowManual || !workcellsAvailable}
              isMarkAllCompleteInProgress={this.state.isMarkAllCompleteInProgress}
              completionSnapshot={this.state.completionSnapshot}
              provisionSpecs={cachedProvisionSpecs}
              onComplete={this.complete}
              onUndo={this.undo}
              onSelect={this.selectForWorkcell}
              WCselectedState={this.state.selected}
              onInstructionChange={this.updateInstruction}
              isHuman={this.isHuman}
              onToggleHuman={this.toggleHuman}
              workcellsAvailable={workcellsAvailable}
            />
            <If condition={workcellsAvailable}>
              <div className={classnames('prime-directive', blockClass)}>
                <Drawer
                  open={!!this.numSelected()}
                  drawerHeightReporter={(height) => {
                    if (height !== this.props.drawerHeight) {
                      DrawerActions.setHeight(height);
                    }
                  }}
                >
                  <SendToWorkcellDrawer
                    onCancel={this.selectAll}
                    scheduleDelay={this.state.scheduleDelay}
                    workcellState={this.state.state}
                    selectedWorkcell={this.state.workcellId}
                    selectedSession={this.state.selectedSessionId}
                    workcellChoices={this.getWorkcellChoices()}
                    sessionChoices={this.state.sessions}
                    maxScheduleTime={this.state.maxScheduleTime}
                    isTestSubmission={this.state.isTestSubmission}
                    allowConstraintViolations={
                      this.state.isTestSubmission &&
                      this.state.suggestingTimeConstraints
                    }
                    reserveDestinies={this.state.reserveDestinies}
                    isBusy={false}
                    onScheduleTimeChange={(e) => {
                      this.setState({ maxScheduleTime: e.target.value });
                    }}
                    onTestWorkcellToggleChange={() => {
                      this.setState({
                        isTestSubmission: !this.state.isTestSubmission
                      });
                    }}
                    onWorkcellChoiceChange={(e) => {
                      const workcellId = e.target.value;
                      this.setState({
                        workcellId,
                        sessions: [],
                        selectedSessionId: null
                      });
                      this.updateSessions(workcellId);
                    }}
                    onSessionChoiceChange={(e) =>
                      this.setState({ selectedSessionId: e.target.value })
                    }
                    onAllowConstraintViolationsToggleChange={() => {
                      this.setState({
                        suggestingTimeConstraints:
                          !this.state.suggestingTimeConstraints
                      });
                    }}
                    onReserveDestiniesChange={() => {
                      this.setState({
                        reserveDestinies: !this.state.reserveDestinies
                      });
                    }}
                    onSchedule={(submitButtonCallback) => {
                      return this.sendToWorkcell(
                        this.state.workcellId,
                        this.state.maxScheduleTime,
                        false,
                        this.state.isTestSubmission &&
                          this.state.suggestingTimeConstraints,
                        submitButtonCallback,
                        this.state.selectedSessionId,
                        this.state.isTestSubmission,
                        this.state.reserveDestinies
                      );
                    }}
                    onAbort={this.abortSchedule}
                    numInstructions={this.numSelected()}
                    schedules={this.state.schedulerStats}
                  />
                </Drawer>
              </div>
              <SinglePaneModal
                modalId={RUN_SCHEDULED_MODAL}
                title={`Scheduled ${runTitle}`}
              >
                {selectedWorkcellPath ? (
                  <p>
                    Click{' '}
                    <a
                      href={`${window.location.origin}${selectedWorkcellPath}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      here
                    </a>{' '}
                    to view the SCLE dashboard
                  </p>
                ) : (
                  <p> No URI has been provided to link to the SCLE dashboard</p>
                )}
              </SinglePaneModal>
              <WarningsModal
                runId={this.state.run.get('id')}
                warnings={this.state.warnings}
                onAccept={() => {
                  ModalActions.close('WarningsModal');
                  this.sendToWorkcell(
                    this.state.workcellId,
                    this.state.maxScheduleTime,
                    true,
                    false,
                    () => this.setState({ state: 'ready' }),
                    this.state.selectedSessionId,
                    undefined,
                    this.state.reserveDestinies
                  );
                }}
              />
            </If>
            <ScheduleModal
              run={this.state.run && this.state.run.toJS()}
              runApprove={this.onRunSchedule}
              modalType="schedule"
            />
            {canExportCSV && (
            <ExportCSVModal
              instructions={instructionsWithESA}
              runId={this.state.run.get('id')}
            />
            )}
          </div>
        </TabLayout>
      </PageLayout>
    );
  }

  render() {
    return (
      <Choose>
        <When condition={this.state.failureCode}>
          <Page statusCode={this.state.failureCode} />
        </When>
        <When condition={!this.state.run}>
          <Spinner />
        </When>
        <Otherwise>
          <Page>
            {this.renderMain()}
          </Page>
        </Otherwise>
      </Choose>
    );
  }
}

const getStateFromStores = (props) => {
  const run = RunStore.getById(props.runId);
  let provisionInsts;
  let ids;
  let workcells = Immutable.Iterable();

  if (run) {
    provisionInsts = run.get('instructions').filter((inst) => {
      return inst.getIn(['operation', 'op']) === 'provision' ||
             (inst.getIn(['operation', 'op']) === 'dispense' && inst.getIn(['operation', 'resource_id']));
    });
    ids = provisionInsts.map(inst => inst.get('id')).toJS();
    workcells = WorkcellStore.getByLabId(run.get('lab_id'));
  }

  const provisionSpecs = ProvisionSpecStore.findByInstructions(ids);

  return {
    run: run || Immutable.Map(),
    provisionSpecs,
    drawerOpen: DrawerStore.isOpen(),
    drawerHeight: DrawerStore.getHeight(),
    workcells
  };
};

const ConnectedPrimeDirective = ConnectToStores(PrimeDirective, getStateFromStores);

function PrimeDirectiveRoute(props) {
  return (
    <ConnectedPrimeDirective runId={props.match.params.runId} subTab={props.match.params.subTab} runStatus={props.match.params.runStatus} subdomain={props.match.params.subdomain} />
  );
}

PrimeDirectiveRoute.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      runId: PropTypes.string,
      subTab: PropTypes.string,
      runStatus: PropTypes.string
    })
  })
};

export default PrimeDirectiveRoute;
export { PrimeDirective };
