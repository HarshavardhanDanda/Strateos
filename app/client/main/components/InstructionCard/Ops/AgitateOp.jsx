import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Immutable from 'immutable';

import { Param }   from '@transcriptic/amino';
import Unit from 'main/components/unit';
import { ContainerTag, WellTag } from 'main/components/InstructionTags/index';

class Agitate extends Component {
  static get propTypes() {
    return {
      instruction: PropTypes.object.isRequired,
      run: PropTypes.instanceOf(Immutable.Map).isRequired
    };
  }

  render() {
    const { operation, sequence_no } = this.props.instruction;
    const { object, duration, speed, temperature, mode, mode_params } = operation;
    return (
      <ul className="params">
        <Param
          label="Mode"
          value={mode}
        />
        <Param
          label="Object"
          value={(
            <ContainerTag
              refName={object}
              run={this.props.run}
              instructionSequenceNo={sequence_no}
              showTimeConstraint
              showTimeConstraintDetail
            />
          )}
        />
        <Param
          label="Duration"
          value={<Unit value={duration} />}
        />
        <Param
          label="Speed"
          value={<Unit value={speed} />}
        />
        <If condition={temperature != undefined}>
          <Param
            label="Temperature"
            value={<Unit value={temperature} />}
          />
        </If>
        <If condition={Boolean(mode_params)}>
          <Param
            label="Wells"
            value={mode_params.wells.map((well) => {
              return (
                <span key={well}>
                  <WellTag refName={well} run={this.props.run} />
                  {' '}
                </span>
              );
            })}
          />
          <Param
            label="Bar Length"
            value={mode_params.bar_length}
          />
          <Param
            label="Bar Shape"
            value={mode_params.bar_shape}
          />
        </If>
      </ul>
    );
  }
}

export default Agitate;
