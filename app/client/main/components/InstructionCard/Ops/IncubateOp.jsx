import Immutable from 'immutable';
import _         from 'lodash';
import PropTypes from 'prop-types';
import React     from 'react';

import ModalActions               from 'main/actions/ModalActions';
import { ContainerTag }           from 'main/components/InstructionTags/index';
import { FullscreenModal }        from 'main/components/Modal';
import InstructionDiagnostics     from 'main/diagnostics/InstructionDiagnostics';
import { canViewDiagnosticsData } from 'main/util/DiagnosticsUtil';
import * as UnitUtil              from 'main/util/unit';

import { Param, Button } from '@transcriptic/amino';

class IncubateOp extends React.PureComponent {
  static get propTypes() {
    return {
      run:         PropTypes.instanceOf(Immutable.Map).isRequired,
      instruction: PropTypes.object.isRequired
    };
  }

  modalId() {
    return `INCUBATE_DIAGNOSTICS_MODAL_${this.props.instruction.id}`;
  }

  render() {
    const op = this.props.instruction.operation;
    const { sequence_no } = this.props.instruction;

    return (
      <div className="incubate-op">
        <If condition={canViewDiagnosticsData(this.props.instruction)}>
          <div className="diagnostics-label">
            <Button type="primary" link onClick={() => ModalActions.open(this.modalId())}>
              Show Diagnostics Data
            </Button>
          </div>
        </If>
        <ul className="params">
          <Param
            label="Object"
            value={(
              <ContainerTag
                refName={op.object}
                run={this.props.run}
                instructionSequenceNo={sequence_no}
                showTimeConstraint
                showTimeConstraintDetail
              />
            )}
          />
          <Param
            label="Duration"
            value={UnitUtil.convertUnitForDisplay(op.duration, 'time')}
          />
          <Param label="Where"   value={op.where} />
          <Param label="Shaking" value={op.shaking ? 'Yes' : 'No'} />
          <Param label="CO2"     value={`${op.co2_percent || 0} %`} />
        </ul>
        <FullscreenModal
          modalId={this.modalId()}
          title="Incubate Diagnostics"
        >
          <InstructionDiagnostics
            instruction={this.props.instruction}
            sensorTypes={['temperature', 'humidity', 'co2']}
          />
        </FullscreenModal>
      </div>
    );
  }
}

export default IncubateOp;
