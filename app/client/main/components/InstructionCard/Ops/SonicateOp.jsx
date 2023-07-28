import Immutable from 'immutable';
import _         from 'lodash';
import PropTypes from 'prop-types';
import React     from 'react';

import { Param }   from '@transcriptic/amino';

import { WellTag } from 'main/components/InstructionTags/index';
import Unit        from 'main/components/unit';

class SonicateOp extends React.PureComponent {

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
          label="Duration"
          value={
            <Unit value={op.duration} />
          }
        />

        <Param
          label="Frequency"
          value={<Unit value={op.frequency} />}
        />

        <Param
          label="Mode"
          value={op.mode}
        />
        <Choose>
          <When condition={op.mode === 'horn'}>
            <Param
              label="Duty Cycle"
              value={op.mode_params.duty_cycle}
            />
            <Param
              label="Amplitude"
              value={<Unit value={op.mode_params.amplitude} />}
            />
          </When>
          <When condition={op.mode === 'bath'}>
            <Param
              label="Sample Holder"
              value={op.mode_params.sample_holder}
            />
            <Param
              label="Power"
              value={<Unit value={op.mode_params.power} />}
            />
          </When>
        </Choose>
      </ul>
    );
  }
}

export default SonicateOp;
