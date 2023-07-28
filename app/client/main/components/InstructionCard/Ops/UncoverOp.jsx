import Immutable from 'immutable';
import _ from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';

import { Param } from '@transcriptic/amino';
import { ContainerTag } from 'main/components/InstructionTags/index';

class UncoverOp extends React.PureComponent {
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
        <If condition={op.store_lid != undefined}>
          <Param label="Store Lid" value={`${op.store_lid}`} />
        </If>
      </ul>
    );
  }
}

UncoverOp.displayName = 'UncoverOp';

UncoverOp.propTypes = {
  run: PropTypes.instanceOf(Immutable.Map).isRequired,
  instruction: PropTypes.object.isRequired
};

export default UncoverOp;
