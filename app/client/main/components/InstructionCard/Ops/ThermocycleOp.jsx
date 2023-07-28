import _         from 'lodash';
import PropTypes from 'prop-types';
import React     from 'react';

import ModalActions               from 'main/actions/ModalActions';
import { FullscreenModal }        from 'main/components/Modal';
import Unit                       from 'main/components/unit';
import InstructionDiagnostics     from 'main/diagnostics/InstructionDiagnostics';
import { canViewDiagnosticsData } from 'main/util/DiagnosticsUtil';

import { Param, Button } from '@transcriptic/amino';

class ThermocycleOp extends React.PureComponent {
  static get propTypes() {
    return {
      instruction: PropTypes.object.isRequired
    };
  }

  modalId() {
    return `THERMOCYCLE_DIAGNOSTICS_MODAL_${this.props.instruction.id}`;
  }

  render() {
    const op = this.props.instruction.operation;

    return (
      <div>
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
            label="Volume"
            value={
              <Unit value={op.volume != undefined ? op.volume : '10:microliter'} />
            }
          />
          <If condition={op.lid_temperature != undefined}>
            <Param
              label="Lid Temperature"
              value={
                <Unit value={op.lid_temperature} />
              }
            />
          </If>
          <Param
            label="Groups"
            value={(
              <table>
                <tbody>
                  <tr className="thermocycle-head"><td>Num</td><td>Steps</td></tr>
                  {op.groups.map((g, i) => {
                    return (
                      // eslint-disable-next-line react/no-array-index-key
                      <tr key={i}>
                        <td className="cycles">{`${g.cycles}×`}</td>
                        <td>
                          <ul>
                            {g.steps.map((s, j) => {
                              return (
                                // eslint-disable-next-line react/no-array-index-key
                                <li key={j}>
                                  <Unit value={s.duration} />
                                  {' @ '}
                                  <Choose>
                                    <When condition={s.gradient != undefined}>
                                      <span>
                                        <Unit value={s.gradient.top} />
                                        <span> - </span>
                                        <Unit value={s.gradient.bottom} />
                                        <span> (Top - Bottom)</span>
                                      </span>
                                    </When>
                                    <Otherwise>
                                      <Unit value={s.temperature} />
                                    </Otherwise>
                                  </Choose>
                                </li>
                              );
                            })}
                          </ul>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          />
        </ul>
        <FullscreenModal modalId={this.modalId()} title="Thermocycle Diagnostics">
          <InstructionDiagnostics
            instruction={this.props.instruction}
            sensorTypes={['blockTemp', 'lidTemp']}
          />
        </FullscreenModal>
      </div>
    );
  }
}

export default ThermocycleOp;
