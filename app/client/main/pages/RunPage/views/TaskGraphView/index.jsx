import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React     from 'react';

import ConnectToStores from 'main/containers/ConnectToStoresHOC';
import RunStore from 'main/stores/RunStore';
import RunActions from 'main/actions/RunActions';
import { PageLoading } from '@transcriptic/amino';
import TaskGraphDataProvider from 'main/taskgraph/TaskGraphDataProvider';

const matchPropTypes = PropTypes.shape({
  params: PropTypes.shape({
    runId: PropTypes.string.isRequired,
    projectId: PropTypes.string.isRequired
  }).isRequired
}).isRequired;

class TaskGraphView extends React.PureComponent {
  static get propTypes() {
    return {
      match: matchPropTypes,
      projectId: PropTypes.string.isRequired,
      run: PropTypes.instanceOf(Immutable.Map)
    };
  }

  constructor() {
    super();
    this.state = { statusCode: undefined };
  }

  componentDidMount() {
    //  This is required for RunHeader
    const { projectId,  runId } = this.props;

    return RunActions.load(projectId, runId)
      .fail(xhr => this.setState({ statusCode: xhr.status }));
  }

  render() {
    const { projectId, run, runId } = this.props;
    return (
      <Choose>
        <When condition={!run}>
          <PageLoading />
        </When>
        <Otherwise>
          <TaskGraphDataProvider
            projectId={projectId}
            runId={runId}
          />
        </Otherwise>
      </Choose>
    );
  }
}

const getStateFromStores = (props) => {
  const runId = props.match.params.runId;
  const run = RunStore.getById(runId);
  const projectId = props.match.params.projectId || (run && run.get('project_id'));
  return {
    run,
    projectId,
    runId
  };
};

const ConnectedTaskGraphView = ConnectToStores(TaskGraphView, getStateFromStores);

ConnectedTaskGraphView.propTypes = { match: matchPropTypes };

export default ConnectedTaskGraphView;
