import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React     from 'react';

import ImmutableUtil          from 'main/util/ImmutableUtil';
import ProvisionSelectorModal from 'main/lab/ProvisionSelectorModal';
import ModalActions from 'main/actions/ModalActions';
import { Tooltip } from '@transcriptic/amino';

function ProvisionAction(props) {
  const modalId = `${ProvisionSelectorModal.MODAL_ID}${props.instruction.get('id')}`;

  const refsByName = ImmutableUtil.indexBy(props.refs, 'name');

  return (
    <div
      className={`lab-checkbox databox ${props.provisionSpec ? 'set' : ''}`}
      onClick={() => ModalActions.open(modalId)}
    >
      <ProvisionSelectorModal
        modalId={modalId}
        runId={props.runId}
        instruction={props.instruction}
        refsByName={refsByName}
        completed={props.completed}
      />
      <Tooltip
        placement="bottom"
        title="Automatically generate Provision specifications, this will mark this instruction as in progress"
      >
        <i className="fa fa-flask" />
      </Tooltip>
    </div>
  );
}

ProvisionAction.propTypes = {
  provisionSpec: PropTypes.instanceOf(Immutable.Map),
  completed: PropTypes.bool.isRequired,
  runId: PropTypes.string.isRequired,
  instruction: PropTypes.instanceOf(Immutable.Map).isRequired,
  refs: PropTypes.instanceOf(Immutable.Iterable).isRequired
};

export default ProvisionAction;
