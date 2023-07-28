import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React     from 'react';
import humanize  from 'underscore.string/humanize';
import titleize  from 'underscore.string/titleize';

import ModalActions         from 'main/actions/ModalActions';
import MeasureDataModal     from 'main/components/MeasureDataModal';
import ShowMeasureDataModal from 'main/lab/ShowMeasureDataModal';
import { Tooltip } from '@transcriptic/amino';

function MeasureDataUploader(props) {
  const getTitle = () => {
    const op = props.instruction.getIn(['operation', 'op']);
    if (props.instruction.getIn(['operation', 'measurement'])) {
      return `${titleize(humanize(op))} Data (${props.instruction.getIn(['operation', 'measurement'])})`;
    } else {
      return `${titleize(humanize(op))} Data`;
    }
  };

  const createModalId = () => {
    return `MeasureDataModal_${props.instruction.get('id')}`;
  };

  const showModalId = () => {
    return `ShowMeasureDataModal_${props.instruction.get('id')}`;
  };

  const showDatasetCreateModal = (e) => {
    e.stopPropagation();
    return ModalActions.open(createModalId());
  };

  const showDatasetModal = (e) => {
    e.stopPropagation();
    return ModalActions.open(showModalId());
  };

  return (
    <div>
      <MeasureDataModal
        modalId={createModalId()}
        title={getTitle()}
        run={props.run}
        instruction={props.instruction}
        onInstructionUpdate={props.onInstructionUpdate}
        closeOnClickOut={false}
      />
      <If condition={props.dataset !== undefined}>
        <ShowMeasureDataModal
          modalId={showModalId()}
          instruction={props.instruction}
          onInstructionUpdate={props.onInstructionUpdate}
          dataset={props.dataset}
        />
      </If>
      <div
        className={`lab-checkbox databox ${props.dataset ? 'set' : ''}`}
        onClick={props.dataset ? e => showDatasetModal(e) : e => showDatasetCreateModal(e)}
      >
        <Tooltip
          placement="bottom"
          title="Attach or modify a dataset linked to this instruction"
        >
          <i className="fa fa-hashtag" />
        </Tooltip>
      </div>
    </div>
  );
}

MeasureDataUploader.propTypes = {
  run:                 PropTypes.instanceOf(Immutable.Map).isRequired,
  instruction:         PropTypes.instanceOf(Immutable.Map).isRequired,
  dataset:             PropTypes.instanceOf(Immutable.Map),
  onInstructionUpdate: PropTypes.func.isRequired
};

export default MeasureDataUploader;
