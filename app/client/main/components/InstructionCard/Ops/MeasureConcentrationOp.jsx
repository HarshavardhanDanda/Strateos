import Immutable from 'immutable';
import _ from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';

import { WellTag } from 'main/components/InstructionTags/index';
import Unit from 'main/components/unit';

import { Param } from '@transcriptic/amino';

class MeasureConcentrationOp extends React.PureComponent {
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
        <Param label="Measurement" value={op.measurement} />
        <Param
          label="Volume"
          value={<Unit value={op.volume != undefined ? op.volume : 2} />}
        />
      </ul>
    );
  }
}

MeasureConcentrationOp.displayName = 'MeasureConcentrationOp';

MeasureConcentrationOp.propTypes = {
  run: PropTypes.instanceOf(Immutable.Map).isRequired,
  instruction: PropTypes.object.isRequired
};

export default MeasureConcentrationOp;
