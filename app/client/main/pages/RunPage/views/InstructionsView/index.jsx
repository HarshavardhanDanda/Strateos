import Immutable from 'immutable';
import bindAll   from 'lodash/bindAll';
import Moment    from 'moment';
import PropTypes from 'prop-types';
import React     from 'react';
import _         from 'lodash';

import { ZeroState, Spinner, PageLoading, DateTime } from '@transcriptic/amino';
import { Link }                        from 'react-router-dom';
import AcsControls                     from 'main/util/AcsControls';
import FeatureConstants                from '@strateos/features';
import Urls                            from 'main/util/urls';
import ProtocolActions                 from 'main/actions/ProtocolActions';
import RunActions                      from 'main/actions/RunActions';
import WarpEventActions                from 'main/actions/WarpEventActions';
import InstructionsAPI                 from 'main/api/InstructionAPI';
import RefAPI                          from 'main/api/RefAPI';
import ProtocolTitle                   from 'main/components/ProtocolTitle';
import { RunDatum }                    from 'main/components/RunDatum';
import { RunRefContainer }             from 'main/components/RunRef';
import { TabLayout }                   from 'main/components/TabLayout';
import ConnectToStores                 from 'main/containers/ConnectToStoresHOC';
import assembleFullJSON                from 'main/helpers/RunPage/assembleFullJSON';
import loadStatus, { runIsFullJSON }   from 'main/helpers/RunPage/loadStatus';
import orderedInstructionsWithRefNames from 'main/helpers/RunPage/orderedInstructionsWithRefNames';
import { RunRequest }                  from 'main/project/RunRequest';
import ProtocolStore                   from 'main/stores/ProtocolStore';
import RunStore                        from 'main/stores/RunStore';
import ConnectedGeneratedContainer from 'main/components/RunRef/GeneratedContainer';

// Stores
import InstructionStore from 'main/stores/InstructionStore';
import RefStore         from 'main/stores/RefStore';
import WarpEventStore   from 'main/stores/WarpEventStore';
import WorkflowStore    from 'main/stores/WorkflowStore';

import DetailsContainer from './DetailsContainer';

import './RunExecutionPage.scss';

class InstructionsView extends React.Component {
  constructor() {
    super();

    this.state = {
      selectedRef: undefined,
      selectedDataRef: undefined,
      selectedContainerId: undefined,
      statusCode: undefined,
      showWaitingForMoreInstructionsStatus: false,
      emptyState: false
    };

    bindAll(
      this,
      'onNavigateRef',
      'onNavigateDataref',
      'onNavigateContainer',
      'onDetailsContainerClose',
      'getFocusedRef',
      'getFocusedDataset',
      'termination'
    );

    this.instructionsQueryLimit = 30;
    this.instructionsFetchShouldShowLoadingTimer = undefined;
  }

  componentWillMount() {
    const { warpEventErrors, match, run, projectId } = this.props;
    const { runId } = match.params;
    const { runLoaded, instructionsLoaded, refsLoaded } = loadStatus(run);

    this.fetchAndSaveData({
      shouldFetchRun: !runLoaded,
      shouldFetchInstructions: !instructionsLoaded,
      shouldFetchRefs: !refsLoaded
    });

    if (warpEventErrors.count() === 0 && Transcriptic.current_user.system_admin) {
      WarpEventActions.warpEventErrorsForRun(projectId, runId);
    }
  }

  onNavigateRef(refName) {
    if (this.state.selectedRef === refName) return;

    this.setState({
      selectedRef: refName,
      selectedDataRef: undefined,
      selectedContainerId: undefined
    });
  }

  onNavigateContainer(containerId) {
    if (this.state.selectedContainerId === containerId) return;

    this.setState({
      selectedRef: undefined,
      selectedDataRef: undefined,
      selectedContainerId: containerId
    });
  }

  onNavigateDataref(dataRef) {
    if (this.state.selectedDataRef === dataRef) return;

    this.setState({
      selectedRef: undefined,
      selectedDataRef: dataRef,
      selectedContainerId: undefined
    });
  }

  onDetailsContainerClose() {
    this.setState({ selectedRef: undefined });
    this.setState({ selectedContainerId: undefined });
  }

  onStatusCodeChange(newStatusCode) {
    this.setState({ statusCode: newStatusCode });
  }

  getFocusedRef() {
    const { run } = this.props;
    const { runLoaded } = loadStatus(run);

    if (!runLoaded) return undefined;

    return run
      .get('refs')
      .find(ref => ref.get('name') === this.state.selectedRef);
  }

  getFocusedDataset() {
    const { run } = this.props;
    const { runLoaded, instructionsLoaded } = loadStatus(run);

    if (!runLoaded || !instructionsLoaded) return undefined;

    const instruction = run.get('instructions').find(i =>
      i.getIn(['operation', 'dataref']) === this.state.selectedDataRef
    );

    if (!instruction) return undefined;

    return run.get('datasets').find(d => (
      d.get('instruction_id') === instruction.get('id')
    ));
  }

  startInstructionFetchStatusTimer() {
    this.instructionsFetchShouldShowLoadingTimer = setTimeout(() => {
      this.setState({ showWaitingForMoreInstructionsStatus: true });
    }, 1000);
  }

  clearInstructionFetchStatusTimer() {
    clearTimeout(this.instructionsFetchShouldShowLoadingTimer);
    this.setState({ showWaitingForMoreInstructionsStatus: false });
  }

  fetchAndSaveData({ shouldFetchRun, shouldFetchInstructions, shouldFetchRefs }) {
    if (shouldFetchRun) {
      const runPromise = this.fetchRun();

      runPromise.then((run) => {
        const protocolId = run.protocol_id;

        if (protocolId) {
          this.fetchProtocol(protocolId);
        }
      });
    }

    if (shouldFetchRefs) this.fetchRefs();
    if (shouldFetchInstructions) this.fetchInstructions();
  }

  fetchRun() {
    const { runId } = this.props.match.params;
    const { projectId } = this.props;

    return RunActions.loadMinimal(projectId, runId)
      .fail(err => this.onStatusCodeChange(err.status));
  }

  fetchProtocol(protocolId) {
    return ProtocolActions.load(protocolId)
      .fail(err => this.onStatusCodeChange(err.status));
  }

  fetchInstructions() {
    const { runId } = this.props.match.params;

    this.startInstructionFetchStatusTimer();

    return InstructionsAPI.fetchAllForRun(runId, this.instructionsQueryLimit)
      .then(res => {
        if (!res) this.setState({ emptyState: true });
      })
      .fail(err => this.onStatusCodeChange(err.status))
      .always(() => this.clearInstructionFetchStatusTimer());
  }

  fetchRefs() {
    const { runId } = this.props.match.params;

    return RefAPI.fetchWithContainersOmcs(runId)
      .fail(err => this.onStatusCodeChange(err.status));
  }

  termination(action, actionName) {
    return (reset) => {
      const { run } = this.props;

      let message = `${actionName} the run?`;

      if (run.get('dependents').size > 0) {
        message += ` The following dependent runs will also be ${actionName.toLowerCase()}ed:` +
          ` ${run.get('dependents').map(dependent => dependent.get('id'))}`;
      }
      if (confirm(message)) {
        return action(this.props.projectId, run.get('id')).fail(reset);
      } else {
        return reset();
      }
    };
  }

  renderSubmittedBy() {
    const { run } = this.props;
    return (
      <span>
        <h4>Submitted By</h4>
        <h3>
          { run.getIn(['owner', 'name']) } { <DateTime timestamp={(run.get('created_at'))} />}
        </h3>
      </span>
    );
  }

  renderWorkFlow() {
    const { definitionId, definitionLabel } = this.props.workflowInstance;
    return (
      <span>
        <h4>Workflow</h4>
        <h2>
          <Link to={Urls.get_workflow_viewer(definitionId)}>
            {definitionLabel}
          </Link>
        </h2>
      </span>
    );
  }

  renderProtocol(runView) {
    const { protocol, run } = this.props;
    return (
      <div>
        <h4>Protocol</h4>
        <h2>
          <ProtocolTitle
            id={run.get('protocol_id')}
            protocol={protocol}
            showUrl={!runView}
          />
        </h2>
      </div>
    );
  }

  renderTimingStats() {
    const startTime = Moment(this.props.run.get('scheduled_to_start_at'));
    return (
      <div className="hidden-print">
        <h4>
          {[
            startTime.isBefore(Moment()) ?
              'Delayed past scheduled start '
              :
              'Scheduled to start ',
            <DateTime timestamp={startTime} key={startTime} />
          ]}
        </h4>
      </div>
    );
  }

  renderDeprecatedRun(run) {
    const type = run.get('request_type');
    return (
      <ZeroState
        title={run.get('title')}
        subTitle={`We no longer support viewing runs of type: ${type}. Please contact support for more information.`}
        hasBorder
      />
    );
  }

  render() {
    const { run, warpEventErrors, match, workflowInstance } = this.props;
    const { instructionId, runView } = match.params;
    const pathInstructionId = instructionId;
    const dataset = this.getFocusedDataset();
    const { runLoaded, instructionsLoaded, refsLoaded } = loadStatus(run);
    const { emptyState } = this.state;
    return (
      <TabLayout theme="gray">
        <div className="run-execution">
          <Choose>
            <When condition={!runLoaded}>
              <PageLoading />
            </When>

            <When condition={run.get('request_type') !== 'protocol'}>
              {this.renderDeprecatedRun(run)}
            </When>

            <Otherwise>
              <div className="run-execution__header">
                <div className="tx-stack tx-stack--sm">
                  { AcsControls.isFeatureEnabled(FeatureConstants.VIEW_WORKFLOWS)
                      && !_.isUndefined(workflowInstance) && !_.isUndefined(workflowInstance.definitionId) ? (
                      this.renderWorkFlow()
                    ) : (
                      this.renderProtocol(runView)
                    )
                    }
                  <div>
                    { this.renderSubmittedBy() }
                  </div>
                  <If
                    condition={run.get('status') === 'accepted' && run.get('scheduled_to_start_at')}
                  >
                    { this.renderTimingStats() }
                  </If>
                </div>
              </div>

              <div className="run-execution__body row">
                <div className={(this.state.selectedContainerId || this.state.selectedRef || this.state.selectedDataRef) ? 'col-sm-4' : 'col-sm-12'}>
                  <Choose>
                    <When condition={instructionsLoaded && refsLoaded}>
                      <RunRequest
                        run={run}
                        warpEventErrors={warpEventErrors}
                        pathInstructionId={pathInstructionId}
                        onNavigateRef={this.onNavigateRef}
                        onNavigateDataref={this.onNavigateDataref}
                        onNavigateContainer={this.onNavigateContainer}
                        showWaitingForMoreInstructionsStatus={this.state.showWaitingForMoreInstructionsStatus}
                      />
                    </When>
                    <When condition={emptyState}>
                      <ZeroState title="No records found" />
                    </When>

                    <Otherwise>
                      <Spinner size="small" />
                    </Otherwise>
                  </Choose>
                </div>
                <div className={(this.state.selectedContainerId || this.state.selectedRef || this.state.selectedDataRef) ? 'col-sm-8' : 'col-sm-0'}>
                  <Choose>
                    <When condition={this.state.selectedRef}>
                      <DetailsContainer
                        onClose={this.onDetailsContainerClose}
                      >
                        <RunRefContainer
                          runView={runView}
                          runRef={this.getFocusedRef()}
                          run={run}
                          showAppearsIn={false}
                        />
                      </DetailsContainer>
                    </When>

                    <When condition={this.state.selectedContainerId}>
                      <DetailsContainer
                        onClose={this.onDetailsContainerClose}
                      >
                        <ConnectedGeneratedContainer
                          containerId={this.state.selectedContainerId}
                        />
                      </DetailsContainer>
                    </When>

                    <When condition={this.state.selectedDataRef != undefined}>
                      <DetailsContainer
                        onClose={() =>
                          this.setState({ selectedDataRef: undefined })
                        }
                      >
                        <RunDatum
                          datasetId={dataset && dataset.get('id')}
                          dataType={dataset && dataset.get('data_type')}
                          runRefs={run.get('refs')}
                          run={run}
                        />
                      </DetailsContainer>
                    </When>
                  </Choose>
                </div>
              </div>
            </Otherwise>
          </Choose>
        </div>
      </TabLayout>
    );
  }
}

InstructionsView.propTypes = {
  run: PropTypes.instanceOf(Immutable.Map),
  protocol: PropTypes.instanceOf(Immutable.Map),
  match: PropTypes.shape({
    params: PropTypes.shape({
      projectId: PropTypes.string.isRequired,
      runId: PropTypes.string.isRequired,
      instructionId: PropTypes.string
    }).isRequired
  }).isRequired,
  warpEventErrors: PropTypes.instanceOf(Immutable.Iterable)
};

const getStateFromStores = (props) => {
  const { runId } = props.match.params;
  const run = RunStore.getById(runId);
  const refs = RefStore.getByRunId(runId).toList();
  const protocol = run && ProtocolStore.getById(run.get('protocol_id'));
  const instructions = orderedInstructionsWithRefNames(InstructionStore.getByRunId(runId), refs);
  const warpEventErrors = WarpEventStore.getAllByWarpStateAndRunId(runId, 'Failed');
  const projectId = props.match.params.projectId || (run && run.get('project_id'));
  const workflowInstance = WorkflowStore.getInstanceByRunId(runId);

  let fullJSON;

  if (runIsFullJSON(run)) {
    fullJSON = run;
  } else {
    fullJSON = assembleFullJSON({ run: run, instructions, refs });
  }

  return {
    run: fullJSON,
    warpEventErrors,
    protocol,
    projectId,
    workflowInstance
  };
};

const ConnectedInstructionsView = ConnectToStores(InstructionsView, getStateFromStores);

ConnectedInstructionsView.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      runId: PropTypes.string,
      projectId: PropTypes.string
    })
  })
};

export default ConnectedInstructionsView;
