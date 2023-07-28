import Immutable from 'immutable';
import _ from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';

import { WellTag } from 'main/components/InstructionTags/index';
import { Param } from '@transcriptic/amino';

class MeasureVolumeOp extends React.PureComponent {
  render() {
    const op = this.props.instruction.operation;

    return (
      <ul className="params">
        <Param
          label="Object"
          value={op.object.map((well) => {
            return (
              <span key={well}>
                <WellTag refName={well} run={this.props.run} />{' '}
              </span>
            );
          })}
        />
      </ul>
    );
  }
}

MeasureVolumeOp.displayName = 'MeasureVolumeOp';

MeasureVolumeOp.propTypes = {
  run: PropTypes.instanceOf(Immutable.Map).isRequired,
  instruction: PropTypes.object.isRequired
};

export default MeasureVolumeOp;
