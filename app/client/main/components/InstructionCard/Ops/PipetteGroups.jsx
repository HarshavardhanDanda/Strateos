import Classnames from 'classnames';
import Immutable from 'immutable';
import _ from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';

import InputStreamer from 'main/containers/InputStreamer';

import TransferGroup from 'main/components/instructions/LiquidTransfers/TransferGroup';

import MixGroup from './MixGroup';
import ConsolidateGroup from './ConsolidateGroup';
import DistributeGroup from './DistributeGroup';

// List of pipette warps like:
// P54/A1  ⟶ destination_plate/A1 1.0 µL
class PipetteGroupsInternal extends React.PureComponent {
  render() {
    const { run, instructionSequenceNo } = this.props;

    return (
      <div className="instruction-table">
        {this.props.groups.map((group, i) => {
          const type = Object.keys(group)[0];
          const body = group[type];
          const focused = _.includes(this.props.selectedGroupsIndices, i);

          return (
            <div
              key={i} // eslint-disable-line react/no-array-index-key
              className={Classnames('pipette-instruction', {
                focused
              })}
              onClick={(e) => {
                if (typeof this.props.onClickGroupIdx === 'function') {
                  this.props.onClickGroupIdx(i);
                }

                e.stopPropagation();
              }}
            >
              <Choose>
                <When condition={type == 'transfer'}>
                  <TransferGroup body={body} run={run} instructionSequenceNo={instructionSequenceNo} />
                </When>
                <When condition={type == 'distribute'}>
                  <DistributeGroup key={type} body={body} run={run} instructionSequenceNo={instructionSequenceNo} />
                </When>
                <When condition={type == 'consolidate'}>
                  <ConsolidateGroup key={type} body={body} run={run} instructionSequenceNo={instructionSequenceNo} />
                </When>
                <When condition={type == 'mix'}>
                  <MixGroup key={type} body={body} run={run} instructionSequenceNo={instructionSequenceNo} />
                </When>
                <Otherwise>
                  <div>UNKNOWN</div>
                </Otherwise>
              </Choose>
            </div>
          );
        })}
      </div>
    );
  }
}

PipetteGroupsInternal.displayName = 'PipetteGroups';

PipetteGroupsInternal.propTypes = {
  run: PropTypes.instanceOf(Immutable.Map).isRequired,
  groups: PropTypes.array.isRequired,
  onClickGroupIdx: PropTypes.func,
  selectedGroupsIndices: PropTypes.array
};

const PipetteGroups = InputStreamer(PipetteGroupsInternal, 'groups', {
  chunkSize: 1
});

export default PipetteGroups;
