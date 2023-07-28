import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React     from 'react';

import { Param }   from '@transcriptic/amino';

import { WellTag } from 'main/components/InstructionTags/index';
import Unit        from 'main/components/unit';

class LCMRMOp extends React.PureComponent {

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
          label="Injection Volume"
          value={
            <Unit value={op.injection_volume} />
          }
        />

        <Param
          label="Method Name"
          value={op.method_name}
        />
      </ul>
    );
  }
}

export default LCMRMOp;
