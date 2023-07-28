import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React     from 'react';

import { toScalar } from 'main/util/unit';
import LiquidHandleVisualsModal from 'main/components/liquid_handle/LiquidHandleVisualsModal';
import LiquidHandleOpSummaries from 'main/components/liquid_handle/LiquidHandleOpSummaries';
import InstructionDiagnostics from 'main/diagnostics/InstructionDiagnostics';
import { canViewDiagnosticsData } from 'main/util/DiagnosticsUtil';
import ModalActions from 'main/actions/ModalActions';
import { FullscreenModal } from 'main/components/Modal';

class LiquidHandleOp extends React.PureComponent {
  constructor(props, context) {
    super(props, context);

    this.showLihaVisualsModal = this.showLihaVisualsModal.bind(this);
  }

  diagnosticsModalId() {
    return `LIQUID_HANDLE_DIAGNOSTICS_MODAL_${this.props.instruction.id}`;
  }

  lihaVisualsModalId() {
    return `LIQUID_HANDLE_VISUALS_MODAL_${this.props.instruction.id}`;
  }

  transferredVolumeString(volumeSum, cycles) {
    const locationCycles = cycles != undefined ? cycles : 1;
    const totalVolume = Number(volumeSum * locationCycles).toFixed(2);

    return `${Math.abs(totalVolume)}µL`;
  }

  convertVolumeToNumber(volume) {
    return toScalar(
      volume != undefined ? volume : '0:microliter',
      'microliter'
    );
  }

  showLihaVisualsModal(e) {
    e.stopPropagation();
    ModalActions.open(this.lihaVisualsModalId());
  }

  render() {
    return (
      <div className="liquid-handle-op">
        <LiquidHandleOpSummaries
          run={this.props.run}
          instruction={Immutable.fromJS(this.props.instruction)}
        />
        <a className="liha-details-link" onClick={this.showLihaVisualsModal}>
          Show Details
        </a>
        <LiquidHandleVisualsModal
          instruction={this.props.instruction}
          run={this.props.run}
        />
        <FullscreenModal
          modalId={this.diagnosticsModalId()}
          title="Liquid Handle Diagnostics"
        >
          <InstructionDiagnostics
            sensorTypes={['pressure']}
            instruction={this.props.instruction}
          />
        </FullscreenModal>
        <If condition={canViewDiagnosticsData(this.props.instruction)}>
          <a
            className="liha-details-link"
            onClick={(e) => {
              e.stopPropagation();
              return ModalActions.open(this.diagnosticsModalId());
            }}
          >
            Show Diagnostics Data
          </a>
        </If>
      </div>
    );
  }
}

LiquidHandleOp.propTypes = {
  run: PropTypes.object.isRequired,
  instruction: PropTypes.object.isRequired
};

export default LiquidHandleOp;
