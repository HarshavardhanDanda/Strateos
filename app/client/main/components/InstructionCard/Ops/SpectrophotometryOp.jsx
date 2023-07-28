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

class IntegrationTimeParam extends React.Component {

  static get propTypes() {
    return {
      integrationTime: PropTypes.string.isRequired
    };
  }

  render() {
    return (
      <Param
        label="Integration Time"
        value={<Unit value={this.props.integrationTime} />}
      />
    );
  }
}

class SpectrophotometryOp extends React.PureComponent {
  static get propTypes() {
    return {
      run:         PropTypes.instanceOf(Immutable.Map).isRequired,
      instruction: PropTypes.object.isRequired
    };
  }

  modalId() {
    return `SPECTROPHOMETRY_DIAGNOSTICS_MODAL_${this.props.instruction.id}`;
  }

  render() {
    const op            = this.props.instruction.operation;
    const { sequence_no } = this.props.instruction;

    return (
      <div className="tx-stack tx-stack--sm">
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
          <If condition={op.temperature != undefined}>
            <Param
              label="Temperature"
              value={<Unit value={op.temperature} />}
            />
          </If>
          <If condition={op.incubate_before != undefined}>
            <Param
              label="Duration"
              value={<Unit value={op.incubate_before.duration} />}
            >
              <If condition={op.incubate_before.shaking != undefined}>
                <Param
                  label={
                    op.incubate_before.shaking.orbital
                      ? 'Orbital Amplitude'
                      : 'Linear Amplitude'
                  }
                  value={<Unit value={op.incubate_before.shaking.amplitude} />}
                />
              </If>
            </Param>
          </If>
          <If condition={op.settle_time != undefined}>
            <Param
              label="Settle Time"
              value={<Unit value={op.settle_time} />}
            />
          </If>
          <Choose>
            <When condition={op.op == 'absorbance'}>
              {[
                <Param
                  key="wavelength"
                  label="Wavelength"
                  value={<Unit value={op.wavelength} />}
                />,
                <Param
                  key="num_flashes"
                  label="Flashes"
                  value={`${op.num_flashes != undefined ? op.num_flashes : 25}`}
                />
              ]}
            </When>
            <When condition={op.op == 'luminescence' && op.integration_time != undefined}>
              <IntegrationTimeParam key="integration_time" integrationTime={op.integration_time} />
            </When>
            <When condition={op.op == 'fluorescence'}>
              {[
                <Param
                  key="emission"
                  label="Emission"
                  value={<Unit value={op.emission} />}
                />,
                <Param
                  key="excitation"
                  label="Excitation"
                  value={<Unit value={op.excitation} />}
                />,
                <Param
                  key="num_flashes"
                  label="Flashes"
                  value={`${op.num_flashes != undefined ? op.num_flashes : 25}`}
                />,
                <Param
                  key="gain"
                  label="Gain"
                  value={
                    op.gain != undefined
                      ? Math.round(op.gain * 1000) / 1000
                      : 'Optimal'
                  }
                />,
                <If condition={op.detection_mode != undefined} key="detection_mode">
                  <Param
                    label="Detection Mode"
                    value={op.detection_mode}
                  />
                </If>,
                <If condition={op.lag_time != undefined} key="lag_time">
                  <Param
                    label="Lag Time"
                    value={<Unit value={op.lag_time} />}
                  />
                </If>,
                <If condition={op.integration_time != undefined} key="integration_time">
                  <IntegrationTimeParam integrationTime={op.integration_time} />
                </If>,
                <If condition={op.position_z != undefined} key="position_z">
                  <If condition={op.position_z.manual != undefined}>
                    <Param
                      label="Manual"
                      value={<Unit value={op.position_z.manual} />}
                    />
                  </If>
                </If>
              ] }
            </When>
          </Choose>
        </ul>
        <FullscreenModal
          modalId={this.modalId()}
          title="Spectrophotometry Diagnostics"
        >
          <InstructionDiagnostics
            instruction={this.props.instruction}
            sensorTypes={['temperature']}
          />
        </FullscreenModal>
      </div>
    );
  }
}

export default SpectrophotometryOp;
