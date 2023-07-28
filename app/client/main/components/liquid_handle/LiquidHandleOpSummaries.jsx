import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React     from 'react';

import * as Unit from 'main/util/unit';
import { WellTag } from 'main/components/InstructionTags/index';

class LiquidHandleOpSummaries extends React.Component {

  static get propTypes() {
    return {
      run:         PropTypes.object.isRequired,
      instruction: PropTypes.instanceOf(Immutable.Map).isRequired
    };
  }

  transferredVolumeString(volumeSum, cycles) {
    const locationCycles = cycles != undefined ? cycles : 1;
    const totalVolume    = Number(volumeSum * locationCycles).toFixed(2);

    return `${Math.abs(totalVolume)}µL`;
  }

  convertVolumeToNumber(volume) {
    return Unit.toScalar(
      volume != undefined ? volume : '0:microliter',
      'microliter'
    );
  }

  render() {
    return (
      <div className="liquid-handle-summaries">
        {this.props.instruction.getIn(['operation', 'locations']).map((location, i) => {
          const transports = location.get('transports');
          const aliquot = location.get('location');

          if ((transports == undefined) || (aliquot == undefined)) {
            return undefined;
          }

          const transferredVolumeSum = transports.reduce((sum, transport) => {
            const liquidClass = transport.getIn(['mode_params', 'liquid_class']);

            if (liquidClass === 'air') {
              return sum;
            }

            return sum + this.convertVolumeToNumber(transport.get('volume'));
          }, 0);

          const arrow = transferredVolumeSum < 0 ? '↑' : '↓';

          return (
            <div className="liha-summary" key={i}>
              <div>
                {this.transferredVolumeString(transferredVolumeSum, location.get('cycles'))}
              </div>
              <WellTag
                refName={location.get('location')}
                run={this.props.run}
                prefix={arrow}
              />
            </div>
          );
        })}
      </div>
    );
  }
}

export default LiquidHandleOpSummaries;
