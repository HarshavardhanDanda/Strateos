import Immutable from 'immutable';
import _ from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';

import { WellTag } from 'main/components/InstructionTags/index';

// TODO Convert to ul.params
class PlasmidPrepOp extends React.PureComponent {
  render() {
    const op = this.props.instruction.operation;

    return (
      <div>
        <table
          style={{
            width: '100%'
          }}
        >
          <tbody>
            {op.groups.map((g, i) => {
              return (
                // eslint-disable-next-line react/no-array-index-key
                <tr key={i}>
                  <td
                    style={{
                      width: '30%',
                      textAlign: 'right'
                    }}
                  >
                    <WellTag refName={g.from} run={this.props.run} />
                  </td>
                  <td>
                    <div
                      style={{
                        padding: '0 5px',
                        float: 'left'
                      }}
                    >
                      {' ⟶ '}
                    </div>
                    <WellTag refName={g.to} run={this.props.run} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }
}

PlasmidPrepOp.displayName = 'PlasmidPrepOp';

PlasmidPrepOp.propTypes = {
  run: PropTypes.instanceOf(Immutable.Map).isRequired,
  instruction: PropTypes.object.isRequired
};

export default PlasmidPrepOp;
