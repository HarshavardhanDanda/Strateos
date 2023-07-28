import Immutable from 'immutable';
import _ from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';

import { ContainerTag } from 'main/components/InstructionTags/index';
import ContainerType from 'main/helpers/ContainerType';
import { containerForRef } from 'main/util/RefUtil';

import { Param } from '@transcriptic/amino';

class SangerSequenceOp extends React.PureComponent {
  render() {
    const op = this.props.instruction.operation;
    const { sequence_no } = this.props.instruction;
    const container = containerForRef(op.object, this.props.run);
    const containerType = new ContainerType(container.container_type);

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
          label="Wells"
          value={op.wells.map(w => containerType.humanWell(w)).join(', ')}
        />
        <Param
          label="Type"
          value={op.type != undefined ? op.type : 'standard'}
        />
        <If condition={op.type === 'rca'}>
          <Param
            label="Primer"
            value={<ContainerTag refName={op.primer} run={this.props.run} />}
          />
        </If>
      </ul>
    );
  }
}

SangerSequenceOp.displayName = 'SangerSequenceOp';

SangerSequenceOp.propTypes = {
  run: PropTypes.instanceOf(Immutable.Map).isRequired,
  instruction: PropTypes.object.isRequired
};

export default SangerSequenceOp;
