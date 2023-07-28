import Immutable from 'immutable';
import _ from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';

import { WellTag } from 'main/components/InstructionTags/index';
import Unit from 'main/components/unit';

import { Param } from '@transcriptic/amino';

class SpreadOp extends React.PureComponent {
  render() {
    const op = this.props.instruction.operation;

    return (
      <ul className="params">
        <Param
          label="From"
          value={<WellTag refName={op.from} run={this.props.run} />}
        />
        <Param
          label="To"
          value={<WellTag refName={op.to} run={this.props.run} />}
        />
        <Param label="Volume" value={<Unit value={op.volume} />} />
      </ul>
    );
  }
}

SpreadOp.displayName = 'SpreadOp';

SpreadOp.propTypes = {
  run: PropTypes.instanceOf(Immutable.Map).isRequired,
  instruction: PropTypes.object.isRequired
};

export default SpreadOp;
