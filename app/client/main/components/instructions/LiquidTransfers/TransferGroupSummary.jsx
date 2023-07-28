import Immutable   from 'immutable';
import { inflect } from 'inflection';
import _           from 'lodash';
import PropTypes   from 'prop-types';
import React       from 'react';

import { WellTag }                         from 'main/components/InstructionTags/index';
import Unit                                from 'main/components/unit';
import { convertUnitForDisplay, toScalar } from 'main/util/unit';

class TransferGroupSummary extends React.Component {
  static get propTypes() {
    return {
      transferGroup: PropTypes.array.isRequired,
      run: PropTypes.instanceOf(Immutable.Map).isRequired
    };
  }

  render() {
    const { transferGroup } = this.props;

    const totalVolume = _.reduce(transferGroup, (sum, transfer) => (
      sum + toScalar(transfer.volume, 'nanoliter')
    ), 0);

    const totalVolumeFormatted = convertUnitForDisplay(`${totalVolume}:nanoliter`, 'volume');

    // Maps from a source aliquot to a map of dest aliquots and their final volumes
    const aggregatedTransfers = {};

    transferGroup.forEach((transfer) => {
      if (aggregatedTransfers[transfer.from] == undefined) {
        aggregatedTransfers[transfer.from] = {};
      }

      if (aggregatedTransfers[transfer.from][transfer.to] == undefined) {
        aggregatedTransfers[transfer.from][transfer.to] = {
          transferCount: 0,
          totalVolume: 0
        };
      }

      aggregatedTransfers[transfer.from][transfer.to].totalVolume += toScalar(transfer.volume, 'nanoliter');
      aggregatedTransfers[transfer.from][transfer.to].transferCount += 1;
    });

    return (
      <div className="transfer-group-summary">
        <div>
          <span className="metric">{transferGroup.length}</span> transfers
        </div>
        <div>
          <span className="metric">{totalVolumeFormatted}</span> total transfer volume
        </div>
        <div className="row-group transfer-group">
          {
            Object.entries(aggregatedTransfers).map((aggregatedTransfersEntry) => {
              const source = aggregatedTransfersEntry[0];
              const destinationMap = aggregatedTransfersEntry[1];

              return Object.entries(destinationMap).map((destinationMapEntry) => {
                const destination = destinationMapEntry[0];
                const data = destinationMapEntry[1];

                return (
                  <div className="row" key={`${source}->${destination}`}>
                    <div className="from">
                      <WellTag refName={source} run={this.props.run} />
                    </div>

                    <div className="target-well">
                      <WellTag refName={destination} run={this.props.run} />
                      <div className="volume-label">
                        <Unit value={`${data.totalVolume}:nanoliter`} />
                      </div>
                      <span>
                        {` (${data.transferCount} ${inflect('transfer', data.transferCount)})`}
                      </span>
                    </div>
                  </div>
                );
              });
            })
          }
        </div>
      </div>
    );
  }
}

export default TransferGroupSummary;
