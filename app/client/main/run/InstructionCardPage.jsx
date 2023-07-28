import React from 'react';
import Immutable from 'immutable';

import ConnectToStores from 'main/containers/ConnectToStoresHOC';
import PropTypes from 'prop-types';

import RunActions from 'main/actions/RunActions';
import RunStore from 'main/stores/RunStore';
import InstructionCard from 'main/components/InstructionCard';
import { Spinner } from '@transcriptic/amino';
import getIdFromEmbeddedId from 'main/util/ParamUtil';

// Embeddable view of an instruction
class InstructionCardPage extends React.Component {
  componentWillMount() {
    const { projectId, runId } = this.props;
    RunActions.load(projectId, runId);
  }

  getInstruction() {
    const { run, instructionId } = this.props;
    if (!run) return undefined;

    return run.get('instructions').find(instruction => instruction.get('id') === instructionId);
  }

  render() {
    const instruction = this.getInstruction();
    if (instruction) {
      return <InstructionCard instruction={instruction} run={this.props.run} />;
    } else {
      return <Spinner />;
    }
  }
}

InstructionCardPage.propTypes = {
  run: PropTypes.instanceOf(Immutable.Map),
  instructionId: PropTypes.string,
  projectId: PropTypes.string,
  runId: PropTypes.string
};

const getStateFromStores = (props) => {
  const { runId, projectId } = props.match.params;
  const instructionId = getIdFromEmbeddedId(props.match.params.instructionId);
  const run = RunStore.getById(runId);

  return {
    run,
    projectId,
    instructionId,
    runId
  };
};

const ConnectedInstructionCardPage = ConnectToStores(InstructionCardPage, getStateFromStores);

ConnectedInstructionCardPage.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      runId: PropTypes.string,
      projectId: PropTypes.string,
      instructionId: PropTypes.string
    })
  })
};

export default ConnectedInstructionCardPage;
