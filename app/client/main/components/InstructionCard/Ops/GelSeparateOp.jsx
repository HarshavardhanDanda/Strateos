import Immutable from 'immutable';
import _ from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';

import { WellTag } from 'main/components/InstructionTags/index';
import Unit from 'main/components/unit';

import { Param } from '@transcriptic/amino';

class GelSeparateOp extends React.PureComponent {
  render() {
    const op = this.props.instruction.operation;

    return (
      <ul className="params">
        <Param
          label="Objects"
          value={op.objects.map((well) => {
            return (
              <span key={well}>
                <WellTag refName={well} run={this.props.run} />{' '}
              </span>
            );
          })}
        />
        <Param
          label="Matrix"
          value={(
            <code>
              {op.matrix}
            </code>
          )}
        />
        <Param
          label="Ladder"
          value={(
            <code>
              {op.ladder}
            </code>
          )}
        />
        <Param label="Duration" value={<Unit value={op.duration} />} />
        <Param
          label="Volume"
          value={(
            <Unit
              value={op.volume != undefined ? op.volume : '20:microliter'}
            />
          )}
        />
      </ul>
    );
  }
}

GelSeparateOp.displayName = 'GelSeparateOp';

GelSeparateOp.propTypes = {
  run: PropTypes.instanceOf(Immutable.Map).isRequired,
  instruction: PropTypes.object.isRequired
};

export default GelSeparateOp;
