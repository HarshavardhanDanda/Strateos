import Immutable from 'immutable';
import _         from 'lodash';
import PropTypes from 'prop-types';
import React     from 'react';

import { Param }   from '@transcriptic/amino';

import { WellTag } from 'main/components/InstructionTags/index';

class NMROp extends React.PureComponent {

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
          label="Object"
          value={<WellTag refName={op.object} run={this.props.run} />}
        />

        <Param
          label="Experiment Type"
          value={op.experiment_type}
        />

        <Param
          label="Solvent"
          value={op.solvent}
        />
      </ul>
    );
  }
}

export default NMROp;
