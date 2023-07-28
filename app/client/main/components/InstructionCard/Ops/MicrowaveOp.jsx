import React from 'react';
import PropTypes from 'prop-types';
import Immutable from 'immutable';

import { ContainerTag }  from 'main/components/InstructionTags/index';
import { Param } from '@transcriptic/amino';

import Unit from 'main/components/unit';

class MicrowaveOp extends React.PureComponent {

  static get propTypes() {
    return {
      run: PropTypes.instanceOf(Immutable.Map).isRequired,
      instruction: PropTypes.object.isRequired
    };
  }

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
          label="Duration"
          value={
            <Unit value={op.duration} />
          }
        />
        <If condition={op.target_temperature != undefined}>
          <Param
            label="Target Temperature"
            value={
              <Unit value={op.target_temperature} />
            }
          />
        </If>
        <If condition={op.pressure != undefined}>
          <Param
            label="Pressure"
            value={
              <Unit value={op.pressure} />
            }
          />
        </If>
      </ul>
    );
  }
}

export default MicrowaveOp;
