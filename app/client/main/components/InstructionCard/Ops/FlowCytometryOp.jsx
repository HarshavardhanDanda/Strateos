import Immutable from 'immutable';
import _ from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';

import { WellTag } from 'main/components/InstructionTags/index';

import { Param } from '@transcriptic/amino';

class FlowCytometryOp extends React.PureComponent {
  static get propTypes() {
    return {
      run:         PropTypes.instanceOf(Immutable.Map).isRequired,
      instruction: PropTypes.object.isRequired
    };
  }

  render() {
    const op = this.props.instruction.operation;

    return (
      <div className="flow-cytometry">
        <ul className="params">
          <Param
            label="Samples"
            value={op.samples.map((well) => {
              return (
                <span key={well}>
                  <WellTag refName={well} run={this.props.run} />
                  {' '}
                </span>
              );
            })}
          />
        </ul>
      </div>
    );
  }
}

export default FlowCytometryOp;
