import keycode   from 'keycode';
import PropTypes from 'prop-types';
import React     from 'react';
import _         from 'lodash';

import InstructionsAPI    from 'main/api/InstructionAPI';
import ConnectToStoresHOC from 'main/containers/ConnectToStoresHOC';
import TaskGraphViewer    from 'main/taskgraph/TaskGraphViewer';
import RunStore           from 'main/stores/RunStore';
import RunActions         from 'main/actions/RunActions';
import * as Analytics     from 'main/analytics/TaskGraphAnalytics';
import { ZeroState, Spinner }      from '@transcriptic/amino';
import ColorUtils         from 'main/util/ColorUtils';

const calcRefColors = (autoprotocol) => {
  const refNames = autoprotocol.get('refs').keySeq().toList();
  return ColorUtils.createColorMap(refNames, ColorUtils.refColorPalette);
};

// This component is meant to provide all necessary data to the TaskGraph component.
// This separation is made because TaskGraph 1) Should have no dependencies on components
// in rWEB, and 2) Should not get any external data on it own.
class TaskGraphDataProvider extends React.Component {
  constructor(props) {
    super(props);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.state = {
      loadingInstructions: false,
      erroredOnFetch: false,
      emptyState: false
    };
  }

  componentWillMount() {
    if (this.allDataIsLoaded()) return;

    this.fetch(this.props.projectId, this.props.runId);
  }

  componentDidMount() {
    Analytics.taskGraphViewed(this.props.runId);
    window.addEventListener('keydown', this.handleKeyDown);
  }

  componentDidUpdate(prevProps) {
    if (this.props.projectId !== prevProps.projectId || this.props.runId !== prevProps.runId) {
      this.fetch(this.props.projectId, this.props.runId);
    }
  }

  componentWillUnmount() {
    window.removeEventListener('keydown', this.handleKeyDown);
  }

  handleKeyDown(e) {
    const key = keycode(e);
    if (key === 'f' && (e.ctrlKey || e.metaKey)) {
      Analytics.usedBrowserFindInPage(this.props.runId);
    }
  }

  fetch(projectId, runId) {
    this.setState({ loadingInstructions: true });
    InstructionsAPI.fetchAllForRun(runId, 50)
      .then(() => this.setState({ loadingInstructions: false }))
      .fail(() => this.setState({ erroredOnFetch: true }));

    this.setState({ erroredOnFetch: false });
    RunActions.loadAutoprotocol(projectId, runId)
      .then((res) => {
        if (_.isEmpty(res)) this.setState({ emptyState: true });
        return this.setState({ erroredOnFetch: true });
      })
      .fail(() => this.setState({ erroredOnFetch: true }));
  }

  allDataIsLoaded() {
    const run = RunStore.getById(this.props.runId);
    if (!run || !run.get) return false;
    return run.get('autoprotocol') && run.get('autoprotocol').size > 0;
  }

  render() {
    if (this.allDataIsLoaded()) {
      const runId        = this.props.runId;
      const run          = RunStore.getById(runId);
      const autoprotocol = run.get('autoprotocol');
      const refColors    = calcRefColors(autoprotocol);

      return (
        <TaskGraphViewer
          autoprotocol={autoprotocol}
          key={run.get('id')}
          run={run}
          refColors={refColors}
          onSelectRef={refName => Analytics.refSelected(runId, refName)}
          onDeselectRef={refName => Analytics.refDeSelected(runId, refName)}
          isLoadingInstructions={this.state.loadingInstructions}
        />
      );
    } else if (this.state.emptyState) {
      return (
        <ZeroState title="No records found" />
      );
    } else if (this.state.erroredOnFetch) {
      return (
        <ZeroState
          title="Error generating task graph"
          subTitle="This is definitely an error on our end and we apologize.
                    We will look into this and get back to you shortly."
        />
      );
    }
    // A fetch must be in progress if there's no data and no errors
    return <Spinner />;
  }
}

const propTypes = {
  projectId: PropTypes.string.isRequired,
  runId: PropTypes.string.isRequired
};

TaskGraphDataProvider.propTypes = propTypes;

const ConnectedTaskGraphDataProvider = ConnectToStoresHOC(TaskGraphDataProvider, () => ({}));

ConnectedTaskGraphDataProvider.propTypes = propTypes;

export default ConnectedTaskGraphDataProvider;
