import Immutable from 'immutable';
import _ from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';

import { ContainerTag } from 'main/components/InstructionTags/index';
import { Param } from '@transcriptic/amino';

class MeasureMassOp extends React.PureComponent {
  render() {
    const op = this.props.instruction.operation;
    const { sequence_no } = this.props.instruction;

    return (
      <ul className="params">
        <Param
          label="Object"
          value={(
            <span key={op.object}>
              <ContainerTag
                refName={op.object}
                run={this.props.run}
                instructionSequenceNo={sequence_no}
                showTimeConstraint
                showTimeConstraintDetail
              />{' '}
            </span>
          )}
        />
      </ul>
    );
  }
}

MeasureMassOp.displayName = 'MeasureMassOp';

MeasureMassOp.propTypes = {
  run: PropTypes.instanceOf(Immutable.Map).isRequired,
  instruction: PropTypes.object.isRequired
};

export default MeasureMassOp;
