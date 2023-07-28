import Immutable from 'immutable';
import _         from 'lodash';
import PropTypes from 'prop-types';
import React     from 'react';

import { ContainerTag } from 'main/components/InstructionTags/index';
import { Param }        from '@transcriptic/amino';

class EnvisionOp extends React.PureComponent {

  static get propTypes() {
    return {
      run: PropTypes.instanceOf(Immutable.Map).isRequired,
      instruction: PropTypes.object.isRequired
    };
  }

  render() {
    const op = this.props.instruction.operation;
    const { sequence_no } = this.props.instruction;

    // search for LabelName from the evp xml string.
    const regexp    = /LabelName="([^"]+)"/;
    const match     = regexp.exec(op.evp);
    const labelName = match ? match[1] : 'Unknown';

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
        <Param label="Evp Label" value={labelName} />
      </ul>
    );
  }
}

export default EnvisionOp;
