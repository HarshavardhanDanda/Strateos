import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Immutable from 'immutable';

import { Param }   from '@transcriptic/amino';
import Unit from 'main/components/unit';
import { ContainerTag } from 'main/components/InstructionTags/index';

function RotateParams({ mode_params }) {
  const { flask_volume, speed, vacuum_pressure, condenser_temperature } = mode_params;
  return (
    <React.Fragment>
      <Param
        label="Flask Volume"
        value={<Unit value={flask_volume} />}
      />
      <Param
        label="Speed"
        value={<Unit value={speed} />}
      />
      <Param
        label="Vacuum Pressure"
        value={<Unit value={vacuum_pressure} />}
      />
      <Param
        label="Condenser Temperature"
        value={<Unit value={condenser_temperature} />}
      />
    </React.Fragment>
  );
}
RotateParams.propTypes = {
  mode_params: PropTypes.shape({
    flask_volume: PropTypes.string,
    speed: PropTypes.string,
    vacuum_pressure: PropTypes.string,
    condenser_temperature: PropTypes.string
  })
};

function CentrifugeParams({ mode_params }) {
  const { spin_acceleration, vacuum_pressure, condenser_temperature } = mode_params;
  return (
    <React.Fragment>
      <Param
        label="Spin Acceleration"
        value={<Unit value={spin_acceleration} />}
      />
      <Param
        label="Vacuum Pressure"
        value={<Unit value={vacuum_pressure} />}
      />
      <Param
        label="Condenser Temperature"
        value={<Unit value={condenser_temperature} />}
      />
    </React.Fragment>
  );
}
CentrifugeParams.propTypes = {
  mode_params: PropTypes.shape({
    spin_acceleration: PropTypes.string,
    vacuum_pressure: PropTypes.string,
    condenser_temperature: PropTypes.string
  })
};

function VortexParams({ mode_params }) {
  const { vortex_speed, vacuum_pressure, condenser_temperature } = mode_params;
  return (
    <React.Fragment>
      <Param
        label="Vortex Speed"
        value={<Unit value={vortex_speed} />}
      />
      <Param
        label="Vacuum Pressure"
        value={<Unit value={vacuum_pressure} />}
      />
      <Param
        label="Condenser Temperature"
        value={<Unit value={condenser_temperature} />}
      />
    </React.Fragment>
  );
}
VortexParams.propTypes = {
  mode_params: PropTypes.shape({
    vortex_speed: PropTypes.string,
    vacuum_pressure: PropTypes.string,
    condenser_temperature: PropTypes.string
  })
};

function BlowdownParams({ mode_params }) {
  const { gas, blow_rate, vortex_speed } = mode_params;
  return (
    <React.Fragment>
      <Param
        label="Gas"
        value={gas}
      />
      <Param
        label="Blow Rate"
        value={<Unit value={blow_rate} />}
      />
      <Param
        label="Vortex Speed"
        value={<Unit value={vortex_speed} />}
      />
    </React.Fragment>
  );
}
BlowdownParams.propTypes = {
  mode_params: PropTypes.shape({
    gas: PropTypes.oneOf(['nitrogen', 'argon', 'helium']),
    blow_rate: PropTypes.string,
    vortex_speed: PropTypes.string
  })
};

const MODE_TO_COMPONENT = {
  rotate: RotateParams,
  centrifuge: CentrifugeParams,
  vortex: VortexParams,
  blowdown: BlowdownParams
};

class Evaporate extends Component {
  static get propTypes() {
    return {
      instruction: PropTypes.shape({
        operation: PropTypes.shape({
          object: PropTypes.string,
          duration: PropTypes.string,
          evaporator_temperature: PropTypes.string,
          mode: PropTypes.string,
          mode_params: PropTypes.object
        }).isRequired
      }),
      run: PropTypes.instanceOf(Immutable.Map).isRequired
    };
  }

  render() {
    const { operation, sequence_no } = this.props.instruction;
    const { object, duration, evaporator_temperature, mode, mode_params } = operation;
    const ModeComponent = MODE_TO_COMPONENT[mode];
    return (
      <ul className="params">
        <Param
          label="Mode"
          value={mode}
        />
        <Param
          label="Object"
          value={<ContainerTag refName={object} run={this.props.run} instructionSequenceNo={sequence_no} showTimeConstraint showTimeConstraintDetail />}
        />
        <Param
          label="Duration"
          value={<Unit value={duration} />}
        />
        <Param
          label="Temperature"
          value={<Unit value={evaporator_temperature} />}
        />
        <ModeComponent mode_params={mode_params} />
      </ul>
    );
  }
}

export default Evaporate;
