import Immutable from 'immutable';
import _         from 'lodash';
import PropTypes from 'prop-types';
import React     from 'react';

import { ContainerTag }  from 'main/components/InstructionTags/index';
import { Param } from '@transcriptic/amino';

class SealOp extends React.PureComponent {
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
        <Param
          label="Type"
          value={op.type != undefined ? op.type : 'ultra-clear'}
        />
        <If condition={op.mode}>
          <Param
            label="Mode"
            value={op.mode}
          />
        </If>
        <If condition={op.mode_params}>
          <If condition={op.mode_params.temperature}>
            <Param
              label="Temperature"
              value={op.mode_params.temperature}
            />
          </If>
          <If condition={op.mode_params.duration}>
            <Param
              label="Duration"
              value={op.mode_params.duration}
            />
          </If>
        </If>
      </ul>
    );
  }
}

SealOp.propTypes = {
  run:         PropTypes.instanceOf(Immutable.Map).isRequired,
  instruction: PropTypes.object.isRequired
};

export default SealOp;
