import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React     from 'react';

import ModalActions from 'main/actions/ModalActions';
import { FullscreenModal } from 'main/components/Modal';
import GelPurifyOperatorVisualization from 'main/lab/GelPurifyOperatorVisualization';

function GelPurifyInstructionButton(props) {
  const modalId = 'GEL_PUREIFY_DIRECTIONS_MODAL';

  const showDirections = (e) => {
    e.stopPropagation();
    return ModalActions.open(modalId);
  };

  return (
    <div className="lab-checkbox databox checked" onClick={e => showDirections(e)}>
      <i className="fa fa-book" />
      <FullscreenModal title="Operator directions for Gel Purify" modalId={modalId}>
        <GelPurifyOperatorVisualization instruction={props.instruction} run={props.run} />
      </FullscreenModal>
    </div>
  );
}

GelPurifyInstructionButton.propTypes = {
  instruction: PropTypes.instanceOf(Immutable.Map).isRequired,
  run: PropTypes.object.isRequired
};

export default GelPurifyInstructionButton;
