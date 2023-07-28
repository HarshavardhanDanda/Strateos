import Immutable from 'immutable';
import _ from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';

import { ContainerTag } from 'main/components/InstructionTags/index';

import { Param } from '@transcriptic/amino';

class BlueWashOp extends React.PureComponent {
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
        <Param label="Kind" value={op.kind} />
      </ul>
    );
  }
}

BlueWashOp.displayName = 'BlueWashOp';

BlueWashOp.propTypes = {
  run: PropTypes.instanceOf(Immutable.Map).isRequired,
  instruction: PropTypes.object.isRequired
};

export default BlueWashOp;
