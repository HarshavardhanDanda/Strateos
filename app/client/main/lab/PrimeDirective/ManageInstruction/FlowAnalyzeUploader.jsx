import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React     from 'react';

import { SinglePaneModal }  from 'main/components/Modal';
import ModalActions         from 'main/actions/ModalActions';
import FlowAnalyzeDataModal from 'main/lab/FlowAnalyzeDataModal';
import { Tooltip } from '@transcriptic/amino';

function FlowAnalyzeUploader(props) {
  const instructionId = props.instruction.get('id');
  const createDatasetModalId = `CREATE_FLOW_DATA_${instructionId}`;
  const showDatasetModalId = `VIEW_FLOW_DATA_MODAL${instructionId}`;

  const showDatasetCreateModal = (e) => {
    e.stopPropagation();
    ModalActions.open(createDatasetModalId);
  };

  const showDatasetModal = (e) => {
    e.stopPropagation();
    ModalActions.open(showDatasetModalId);
  };

  return (
    <div
      className={`lab-checkbox databox ${props.dataset ? 'set' : ''}`}
      onClick={props.dataset ? e => showDatasetModal(e) : e => showDatasetCreateModal(e)}
    >
      <FlowAnalyzeDataModal
        title="Flow Analyze Data"
        modalId={createDatasetModalId}
        run={props.run}
        instruction={props.instruction}
        onInstructionUpdate={props.onInstructionUpdate}
      />
      <SinglePaneModal
        modalId={showDatasetModalId}
        title="DATASET"
      >
        <pre>{JSON.stringify(props.dataset, undefined, 2)}</pre>
      </SinglePaneModal>
      <Tooltip
        placement="bottom"
        title="Attach or modify a dataset linked to this instruction"
      >
        <i className="fa fa-hashtag" />
      </Tooltip>
    </div>
  );
}

FlowAnalyzeUploader.propTypes = {
  run:                 PropTypes.instanceOf(Immutable.Map).isRequired,
  instruction:         PropTypes.instanceOf(Immutable.Map).isRequired,
  dataset:             PropTypes.instanceOf(Immutable.Map),
  onInstructionUpdate: PropTypes.func.isRequired
};

export default FlowAnalyzeUploader;
