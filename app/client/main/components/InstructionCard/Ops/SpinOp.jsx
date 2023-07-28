import Immutable from 'immutable';
import _         from 'lodash';
import PropTypes from 'prop-types';
import React     from 'react';

import ModalActions               from 'main/actions/ModalActions';
import { ContainerTag }           from 'main/components/InstructionTags/index';
import { FullscreenModal }        from 'main/components/Modal';
import Unit                       from 'main/components/unit';
import InstructionDiagnostics     from 'main/diagnostics/InstructionDiagnostics';
import { canViewDiagnosticsData } from 'main/util/DiagnosticsUtil';

import { Param, Button } from '@transcriptic/amino';

class SpinOp extends React.PureComponent {
  static get propTypes() {
    return {
      run:         PropTypes.instanceOf(Immutable.Map).isRequired,
      instruction: PropTypes.object.isRequired
    };
  }

  static get defaultFlowDirection() {
    return 'inward';
  }

  spinDirectionToSpinIcon(direction) {
    if (direction === 'cw') {
      return '↻';
    } else {
      return '↺';
    }
  }

  modalId() {
    return `SPIN_DIAGNOSTICS_MODAL_${this.props.instruction.id}`;
  }

  flowDirection() {
    const defaultDirection = SpinOp.defaultFlowDirection;

    return this.props.instruction.operation.flow_direction || defaultDirection;
  }

  spinDirection() {
    const spinDirection = this.props.instruction.operation.spin_direction;
    const flowDirection = this.flowDirection();

    if (spinDirection) {
      return spinDirection;
    } else if (flowDirection === 'inward') {
      return ['cw'];
    } else {
      return ['cw', 'ccw'];
    }
  }

  spinDirectionStr() {
    return this.spinDirection().map((direction) => {
      if (direction === 'cw') {
        return '↻';
      } else {
        return '↺';
      }
    }).join('&nbsp;&nbsp;&nbsp;&nbsp;');
  }

  render() {
    const op = this.props.instruction.operation;
    const { sequence_no } = this.props.instruction;

    let containers;
    if (op.object) {
      containers = [op.object];
    } else {
      containers = [op.objects];
    }

    return (
      <div className="spin-operation">
        <If condition={canViewDiagnosticsData(this.props.instruction)}>
          <div className="diagnostics-label">
            <Button
              type="primary"
              link
              onClick={() => ModalActions.open(this.modalId())}
            >
              Show Diagnostics Data
            </Button>
          </div>
        </If>
        <ul className="params">
          <Param
            label="Objects"
            value={containers.map((container) => {
              return <ContainerTag key={container} refName={container} run={this.props.run} instructionSequenceNo={sequence_no} showTimeConstraint showTimeConstraintDetail />;
            })}
          />
          <Param
            label="Acceleration"
            value={<Unit value={op.acceleration} />}
          />
          <Param label="Duration"        value={<Unit value={op.duration} />} />
          <Param label="Flow Direction"  value={this.flowDirection()} />
          <Param label="Spin Directions" value={this.spinDirectionStr()} />
        </ul>
        <FullscreenModal modalId={this.modalId()} title="Spin Diagnostics">
          <InstructionDiagnostics
            instruction={this.props.instruction}
            sensorTypes={['angularSpeed', 'temperature']}
          />
        </FullscreenModal>
      </div>
    );
  }
}

export default SpinOp;
