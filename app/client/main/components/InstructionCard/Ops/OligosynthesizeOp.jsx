import Immutable from 'immutable';
import _ from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';

import { WellTag } from 'main/components/InstructionTags/index';

// TODO Convert to ul.params
class OligosynthesizeOp extends React.PureComponent {
  render() {
    const op = this.props.instruction.operation;

    return (
      <table>
        <tbody>
          {op.oligos.map((oligo, i) => {
            return (
              // eslint-disable-next-line react/no-array-index-key
              <tr key={i}>
                <td>
                  <WellTag refName={oligo.destination} run={this.props.run} />
                </td>
                <td>
                  <table className="params">
                    <tbody>
                      <tr>
                        <td>Sequence</td>
                        <td
                          style={{
                            wordBreak: 'break-word'
                          }}
                        >
                          {oligo.sequence}
                        </td>
                      </tr>
                      <tr>
                        <td>Scale</td>
                        <td>
                          {oligo.scale}
                        </td>
                      </tr>
                      <tr>
                        <td>Purification</td>
                        <td>
                          <Choose>
                            <When condition={oligo.purification != undefined}>
                              {oligo.purification}
                            </When>
                            <Otherwise>standard</Otherwise>
                          </Choose>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  }
}

OligosynthesizeOp.displayName = 'OligosynthesizeOp';

OligosynthesizeOp.propTypes = {
  run: PropTypes.instanceOf(Immutable.Map).isRequired,
  instruction: PropTypes.object.isRequired
};

export default OligosynthesizeOp;
