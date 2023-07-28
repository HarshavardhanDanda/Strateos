import Immutable from 'immutable';
import _ from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';

import { Param } from '@transcriptic/amino';
import { ContainerTag } from 'main/components/InstructionTags/index';
import Unit from 'main/components/unit';

class FlashFreezeOp extends React.PureComponent {
  render() {
    const op = this.props.instruction.operation;
    const { sequence_no } = this.props.instruction;

    return (
      <ul className="params">
        <Param
          label="Object"
          value={(
            <ContainerTag
              refName={op.object}
              run={this.props.run}
              instructionSequenceNo={sequence_no}
              showTimeConstraint
              showTimeConstraintDetail
            />
          )}
        />
        <Param label="Duration" value={<Unit value={op.duration} />} />
      </ul>
    );
  }
}

FlashFreezeOp.displayName = 'FlashFreezeOp';

FlashFreezeOp.propTypes = {
  run: PropTypes.instanceOf(Immutable.Map).isRequired,
  instruction: PropTypes.object.isRequired
};

export default FlashFreezeOp;
