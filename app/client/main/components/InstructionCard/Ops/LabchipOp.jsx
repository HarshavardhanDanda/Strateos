import Immutable from 'immutable';
import _         from 'lodash';
import PropTypes from 'prop-types';
import React     from 'react';

import { WellTag } from 'main/components/InstructionTags/index';
import { Param }   from '@transcriptic/amino';

class LabchipOp extends React.PureComponent {

  static get propTypes() {
    return {
      run: PropTypes.instanceOf(Immutable.Map).isRequired,
      instruction: PropTypes.object.isRequired
    };
  }

  render() {
    const op = this.props.instruction.operation;

    return (
      <ul className="params">
        <Param
          label="Wells"
          value={op.wells.map((well) => {
            return (
              <span key={well}>
                <WellTag refName={well} run={this.props.run} />
                {' '}
              </span>
            );
          })}
        />
        <Param
          label="Assay"
          value={op.assay}
        />
      </ul>
    );
  }
}

export default LabchipOp;
