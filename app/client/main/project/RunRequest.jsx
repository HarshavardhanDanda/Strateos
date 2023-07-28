import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React     from 'react';

import { Spinner }         from '@transcriptic/amino';
import RunActions          from 'main/actions/RunActions';
import RunInstructions     from 'main/components/RunInstructions';
import ConnectToStores     from 'main/containers/ConnectToStoresHOC';
import RunStore            from 'main/stores/RunStore';
import getIdFromEmbeddedId from 'main/util/ParamUtil';

class RunRequest extends React.Component {

  static get childContextTypes() {
    return {
      onNavigateRef:     PropTypes.func,
      onNavigateDataref: PropTypes.func,
      onNavigateContainer: PropTypes.func
    };
  }

  static get propTypes() {
    return {
      run: PropTypes.instanceOf(Immutable.Map).isRequired,
      pathInstructionId:                    PropTypes.string,
      warpEventErrors:                      PropTypes.instanceOf(Immutable.Iterable),
      showWaitingForMoreInstructionsStatus: PropTypes.bool,
      onNavigateRef:                        PropTypes.func,
      onNavigateDataref:                    PropTypes.func,
      onNavigateContainer:                    PropTypes.func
    };
  }

  getChildContext() {
    return {
      onNavigateRef: this.props.onNavigateRef,
      onNavigateDataref: this.props.onNavigateDataref,
      onNavigateContainer: this.props.onNavigateContainer
    };
  }

  render() {
    const { run }               = this.props;
    const { pathInstructionId } = this.props;
    const { warpEventErrors }   = this.props;

    return (
      <div className="request-details">
        <RunInstructions
          run={run}
          pathInstructionId={pathInstructionId}
          warpEventErrors={warpEventErrors}
        />
        <If condition={this.props.showWaitingForMoreInstructionsStatus}>
          <Spinner />
        </If>
      </div>
    );
  }
}

class RunRequestPage extends React.Component {

  static get propTypes() {
    return {
      runId:     PropTypes.string.isRequired,
      projectId: PropTypes.string.isRequired,
      run:       PropTypes.instanceOf(Immutable.Map)
    };
  }

  componentWillMount() {
    const { runId }     = this.props;
    const { projectId } = this.props;

    if (runId && projectId) {
      RunActions.load(projectId, runId);
    }
  }

  render() {
    if (!this.props.run) {
      return <Spinner />;
    }

    return <RunRequest run={this.props.run} />;
  }
}

const getStateFromStores = function(props) {
  const runId         = getIdFromEmbeddedId(props.match.params.runId);
  const { projectId } = props.match.params;
  const run           = RunStore.getById(runId);

  return {
    run,
    runId,
    projectId
  };
};

const ConnectedRunRequestPage = ConnectToStores(
  RunRequestPage,
  getStateFromStores
);

ConnectedRunRequestPage.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      runId: PropTypes.string,
      projectId: PropTypes.string
    })
  })
};

export { ConnectedRunRequestPage as RunRequestPage, RunRequest };
