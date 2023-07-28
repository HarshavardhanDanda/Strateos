import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React from 'react';

import * as Unit from 'main/util/unit';
import { WellTag } from 'main/components/InstructionTags';

class SolidHandleOpSummaries extends React.Component {

  static get propTypes() {
    return {
      run: PropTypes.object.isRequired,
      instruction: PropTypes.instanceOf(Immutable.Map).isRequired
    };
  }

  transferredMassString(mass) {
    return `${Math.abs(Number(mass).toFixed(2))}µg`;
  }

  convertMassToNumber(mass) {
    return Unit.toScalar(
      mass != undefined ? mass : '0:microgram',
      'microgram'
    );
  }

  render() {
    return (
      <div className="solid-handle-summaries">
        {this.props.instruction.getIn(['operation', 'locations']).map((location, i) => {
          const transport = location.get('transport');
          const aliquot = location.get('location');

          if ((transport == undefined) || (aliquot == undefined)) {
            return undefined;
          }

          const transferredMass = this.convertMassToNumber(transport.get('amount'));
          const arrow = transferredMass < 0 ? '↑' : '↓';

          return (
            <div className="solid-handle-summary" key={i}>
              <div>
                {this.transferredMassString(transferredMass)}
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

export default SolidHandleOpSummaries;
