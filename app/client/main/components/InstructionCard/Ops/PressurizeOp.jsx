import Immutable from 'immutable';
import _         from 'lodash';
import PropTypes from 'prop-types';
import React     from 'react';

import { Param }   from '@transcriptic/amino';

import { WellTag } from 'main/components/InstructionTags/index';
import Unit        from 'main/components/unit';

class PressurizeOp extends React.PureComponent {

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
          label="Objects"
          value={op.objects.map((well) => {
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
          label="Pressure"
          value={
            <Unit value={op.pressure} />
          }
        />
        <If condition={op.temperature != undefined}>
          <Param
            label="Temperature"
            value={
              <Unit value={op.temperature} />
            }
          />
        </If>
      </ul>
    );
  }
}

export default PressurizeOp;
