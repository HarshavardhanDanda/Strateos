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

import PipetteGroups from './PipetteGroups';

class PipetteOp extends React.PureComponent {
  static get propTypes() {
    return {
      run:         PropTypes.instanceOf(Immutable.Map).isRequired,
      instruction: PropTypes.object.isRequired
    };
  }

  modalId() {
    return `PIPETTE_DIAGNOSTICS_MODAL_${this.props.instruction.id}`;
  }

  render() {
    const op     = this.props.instruction.operation;
    const { sequence_no } = this.props.instruction;
    const magSep = op['x-magnetic_separate'];

    return (
      <div>
        <If condition={magSep}>
          <ul className="params">
            <Param
              label="Magnetic Separate"
              value={(
                <div>
                  <ContainerTag
                    refName={magSep.object}
                    run={this.props.run}
                    instructionSequenceNo={sequence_no}
                    showTimeConstraint
                    showTimeConstraintDetail
                  />
                  {' '}for{' '}
                  <Unit value={magSep.duration} />
                </div>
              )}
            />
          </ul>
        </If>
        <If condition={canViewDiagnosticsData(this.props.instruction)}>
          <div className="diagnostics-label">
            <Button type="primary" link onClick={() => ModalActions.open(this.modalId())}>
              Show Diagnostics Data
            </Button>
          </div>
        </If>
        <PipetteGroups groups={op.groups} run={this.props.run} instructionSequenceNo={sequence_no} />
        <FullscreenModal modalId={this.modalId()} title="Liquid Handling Diagnostics">
          <InstructionDiagnostics
            instruction={this.props.instruction}
            sensorTypes={['pressure']}
          />
        </FullscreenModal>
      </div>
    );
  }
}

export default PipetteOp;
