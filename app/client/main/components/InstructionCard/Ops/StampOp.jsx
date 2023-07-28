import Immutable from 'immutable';
import { inflect } from 'inflection';
import _ from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';

import TransferGroup from 'main/components/instructions/LiquidTransfers/TransferGroup';

// TODO: Convert to ul.params
class StampOp extends React.PureComponent {
  render() {
    const { instruction, run } = this.props;

    return (
      <Choose>
        <When condition={this.props.instruction.operation.groups}>
          <div className="stamp-op instruction-table">
            {this.props.instruction.operation.groups.map((group, index) => {
              const { rows, columns } =
                group.shape != undefined
                  ? group.shape
                  : {
                    rows: 8,
                    columns: 12
                  };
              return (
                // eslint-disable-next-line react/no-array-index-key
                <div key={index}>
                  <div className="shape-description">{`${rows} ${inflect(
                    'row',
                    rows
                  )} by ${columns} ${inflect('column', columns)}`}
                  </div>
                  <TransferGroup body={group.transfer} run={this.props.run} />
                </div>
              );
            })}
          </div>
        </When>
        <Otherwise>
          {/* This is a legacy format of the stamp operation, no longer supported in autoprotocol. */}
          <div className="instruction-table">
            {[
              <TransferGroup
                key="transfer_group"
                body={instruction.transfers}
                run={run}
              />
            ]}
          </div>
        </Otherwise>
      </Choose>
    );
  }
}

StampOp.displayName = 'StampOp';

StampOp.propTypes = {
  run: PropTypes.instanceOf(Immutable.Map).isRequired,
  instruction: PropTypes.object.isRequired
};

export default StampOp;
