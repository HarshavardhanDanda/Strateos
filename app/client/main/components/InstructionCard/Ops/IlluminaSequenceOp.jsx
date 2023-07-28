import Immutable from 'immutable';
import _ from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';

import { Param } from '@transcriptic/amino';
import { WellTag } from 'main/components/InstructionTags/index';

class IlluminaSequenceOp extends React.PureComponent {
  render() {
    const op = this.props.instruction.operation;
    return (
      <ul className="params">
        <Param label="Flowcell" value={op.flowcell} />
        <Param label="Index" value={op.index} />
        <Param
          label="Lanes"
          value={(
            <table className="illumina-sequence-lanes">
              <thead>
                <tr>
                  <th>Object</th>
                  <th>Library concentration</th>
                </tr>
              </thead>
              <tbody>
                {op.lanes.map((lane, i) => {
                  return (
                    // eslint-disable-next-line react/no-array-index-key
                    <tr key={i}>
                      <td>
                        <WellTag refName={lane.object} run={this.props.run} />
                      </td>
                      <td>
                        {lane.library_concentration}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        />
        <Param label="Library size" value={op.library_size} />
        <Param label="Mode" value={op.mode} />
        <Param label="Sequencer" value={op.sequencer} />
      </ul>
    );
  }
}

IlluminaSequenceOp.displayName = 'IlluminaSequenceOp';

IlluminaSequenceOp.propTypes = {
  run: PropTypes.instanceOf(Immutable.Map).isRequired,
  instruction: PropTypes.object.isRequired
};

export default IlluminaSequenceOp;
