import Immutable from 'immutable';
import _         from 'lodash';
import PropTypes from 'prop-types';
import React     from 'react';

import ModalActions         from 'main/actions/ModalActions';
import RunAPI               from 'main/api/RunAPI';
import RunFeedbackModal     from 'main/components/RunFeedbackModal';
import RunList              from 'main/components/RunList';
import { TabLayout }        from 'main/components/TabLayout';
import ConnectToStores      from 'main/containers/ConnectToStoresHOC';
import ProtocolBrowserModal from 'main/project/ProtocolBrowserModal';
import RunStore             from 'main/stores/RunStore';
import SessionStore         from 'main/stores/SessionStore';

import { ZeroState, Spinner, Button } from '@transcriptic/amino';

import RunListSection from '../RunListSection';

const MAX_TO_DISPLAY = 500;

class RunsView extends React.Component {

  constructor(props, context) {
    super(props, context);

    this.state = {
      showCanceled: false,
      loadingRuns: true,
      statusCode: undefined,
      currentFeedbackRunId: undefined
    };
  }

  componentWillMount() {
    const projectId = this.props.project.get('id');
    const runFetch = RunAPI.indexAllParallel({
      filters: {
        project_id: projectId
      },
      fields: {
        runs: [
          'created_at', 'accepted_at', 'started_at', 'completed_at', 'test_mode', 'status', 'friendly_status',
          'progress', 'title', 'project_id', 'internal_run', 'owner_id', 'pending_shipment_ids', 'billing_valid?',
          'protocol_id', 'success', 'success_notes', 'reject_reason', 'reject_description'
        ]
      },
      limit: 30,
      includes: ['owner']
    }, MAX_TO_DISPLAY);

    runFetch
      .done((recordCount) => {
        this.setState({
          loadingRuns: false,
          recordCount
        });
      })
      .fail(() =>
        this.setState({
          statusCode: 400
        })
      );
  }

  renderActions() {
    return (
      <div className="tx-stack">
        {this.state.recordCount >= MAX_TO_DISPLAY && (
          <div className="tx-stack__block--xxlg">
            Displaying the most recent {MAX_TO_DISPLAY} projects.
          </div>
        )}
      </div>
    );
  }

  render() {
    const runs = this.props.runs
      .sortBy(run => run.get('created_at'))
      .reverse()
      .take(MAX_TO_DISPLAY);

    const testModeRuns = runs.filter(run => run.get('test_mode'));

    const scheduledRunsUnsorted = runs.filter((run) => {
      const testMode  = run.get('test_mode');
      const badStatus = _.includes(['canceled', 'aborted', 'complete'], run.get('status'));
      const rejected = _.includes(['rejected'], run.get('status'));

      return !(testMode || badStatus) && !rejected;
    });

    // In-progress runs should be sorted to the bottom of the list, nearer to the completed runs.
    const scheduledRuns = scheduledRunsUnsorted.sortBy((run) => {
      const status = run.get('status');

      switch (status) {
        case 'accepted':
          return 1;
        case 'in_progress':
          return 2;
        default:
          return 0;
      }
    });

    const rejectedRuns = runs.filter((run) => {
      return run.get('status') === 'rejected' && !run.get('test_mode');
    });

    const completedRuns = runs.filter((run) => {
      const testMode   = run.get('test_mode');
      const goodStatus = _.includes(['aborted', 'complete'], run.get('status'));

      return !testMode && goodStatus;
    });

    const canceledRuns = runs.filter((run) => {
      return run.get('status') === 'canceled' && !run.get('test_mode');
    });

    // It is not sufficent to just check runs.count() because these
    // categories are disjoint subsets of runs whose union may not be runs.
    const noRunsToShow = () =>
      Immutable.Seq([scheduledRuns, completedRuns, canceledRuns, testModeRuns])
        .every(rs => rs.count() === 0);

    if (this.state.loadingRuns && runs.isEmpty()) {
      return <Spinner />;
    }

    if (noRunsToShow() && !this.state.loadingRuns) {
      return (
        <TabLayout>
          <ZeroState
            title="You're ready to launch a run!"
            subTitle="Runs are protocols that Strateos executes for you."
            hasBorder
            button={(
              <Button
                type="primary"
                size="large"
                onClick={ProtocolBrowserModal.launchModal}
              >
                Browse All Protocols
              </Button>
            )}
          />
        </TabLayout>
      );
    }

    return (
      <TabLayout>
        <RunFeedbackModal
          success={
            this.state.currentFeedbackRunId &&
            RunStore.getById(this.state.currentFeedbackRunId).get('success')
          }
          successNotes={
            this.state.currentFeedbackRunId &&
            RunStore.getById(this.state.currentFeedbackRunId).get('success_notes')
          }
          projectId={this.props.projectId}
          runId={this.state.currentFeedbackRunId}
        />
        {this.renderActions()}
        <div id="runs" className="runs">
          <RunListSection
            titleNode={<span>{`Scheduled Runs (${scheduledRuns.count()})`}</span>}
            runListNode={(
              scheduledRuns.count() ? (
                <RunList
                  isTestAccount={SessionStore.isTestAccount()}
                  runs={scheduledRuns}
                  projectId={this.props.projectId}
                  loadingRuns={this.state.loadingRuns}
                />
              ) : (
                <ZeroState
                  title="You're ready to launch a run!"
                  subTitle="You don't have any runs scheduled, but you can launch one now."
                  hasBorder
                  button={(
                    <Button
                      type="primary"
                      size="large"
                      onClick={ProtocolBrowserModal.launchModal}
                    >
                      Browse All Protocols
                    </Button>
                    )}
                />
              )
            )}
          />
          {completedRuns.count() > 0 && (
            <RunListSection
              titleNode={<span>{`Completed Runs (${completedRuns.count()})`}</span>}
              runListNode={(
                <RunList
                  isTestAccount={SessionStore.isTestAccount()}
                  runs={completedRuns}
                  projectId={this.props.projectId}
                  loadingRuns={this.state.loadingRuns}
                  onShowFeedback={(runId) => {
                    this.setState({ currentFeedbackRunId: runId }, () => {
                      ModalActions.open('RunFeedbackModal');
                    });
                  }}
                />
              )}
            />
          )}
          {testModeRuns.count() > 0 && (
            <RunListSection
              titleNode={<span>{`Test Runs (${testModeRuns.count()})`}</span>}
              runListNode={(
                <RunList
                  isTestAccount={SessionStore.isTestAccount()}
                  runs={testModeRuns}
                  projectId={this.props.projectId}
                  loadingRuns={this.state.loadingRuns}
                />
              )}
            />
          )}
          {rejectedRuns.count() > 0 && (
            <RunListSection
              titleNode={<span>{`Rejected Runs (${rejectedRuns.count()})`}</span>}
              runListNode={(
                <RunList
                  isTestAccount={SessionStore.isTestAccount()}
                  runs={rejectedRuns}
                  projectId={this.props.projectId}
                  loadingRuns={this.state.loadingRuns}
                />
              )}
            />
          )}
          {canceledRuns.count() > 0 && (
            <RunListSection
              showRuns={this.state.showCanceled}
              titleNode={(
                <span>
                  <span>{`Canceled Runs (${canceledRuns.count()}) `}</span>
                  <span
                    className="link-style-button show-hide-runs"
                    onClick={_e =>
                      this.setState({
                        showCanceled: !this.state.showCanceled
                      })}
                  >
                    {this.state.showCanceled ? 'Hide' : 'Show'}
                  </span>
                </span>
              )}
              runListNode={(
                <RunList
                  isTestAccount={SessionStore.isTestAccount()}
                  runs={canceledRuns}
                  projectId={this.props.projectId}
                  loadingRuns={this.state.loadingRuns}
                  onShowFeedback={(runId) => {
                    this.setState({ currentFeedbackRunId: runId }, () => {
                      ModalActions.open('RunFeedbackModal');
                    });
                  }}
                />
              )}
            />
          )}
        </div>
      </TabLayout>
    );
  }
}

RunsView.propTypes = {
  project:   PropTypes.instanceOf(Immutable.Map).isRequired,
  projectId: PropTypes.string.isRequired,
  runs:      PropTypes.instanceOf(Immutable.Iterable)
};

const getStateFromStores = (props) => {
  const runs          = RunStore.getByProjectId(props.project.get('id'));

  return {
    projectId: props.project.get('id'),
    runs
  };
};

export default ConnectToStores(RunsView, getStateFromStores);
