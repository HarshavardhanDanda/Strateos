import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React     from 'react';

import { SinglePaneModal }  from 'main/components/Modal';
import DatasetActions       from 'main/actions/DatasetActions';

function ShowMeasureDataModal(props) {
  const onDelete = () => {
    return DatasetActions.destroyDatasetPrimeDirective(props.dataset.get('id')).then(props.onInstructionUpdate);
  };

  const modalId = props.modalId || 'ShowMeasureDataModal';

  return (
    <SinglePaneModal
      modalId={modalId}
      title="DATASET"
      onAccept={onDelete}
      acceptText="Delete"
      acceptClass="btn btn-danger"
      acceptConfirm={`Are you sure you want to delete dataset for instruction ${props.instruction.get('id')}?`}
    >
      <pre>
        {JSON.stringify(props.dataset, undefined, 2)}
      </pre>
    </SinglePaneModal>
  );
}

ShowMeasureDataModal.propTypes = {
  instruction:         PropTypes.instanceOf(Immutable.Map).isRequired,
  dataset:             PropTypes.instanceOf(Immutable.Map).isRequired,
  modalId:             PropTypes.string,
  onInstructionUpdate: PropTypes.func.isRequired
};

export default ShowMeasureDataModal;
