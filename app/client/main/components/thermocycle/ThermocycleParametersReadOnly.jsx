import _         from 'lodash';
import PropTypes from 'prop-types';
import React     from 'react';

import ThermocycleGroupReadOnly from 'main/components/thermocycle/ThermocycleGroupReadOnly';

// without dye, no reads can be done
const NON_DYE_MIXES = ['MyTaq', 'KAPA 2G', 'KAPA HiFi', 'Phusion'];

// Control for specifying arbitrary thermocycle groups. Each group has a cycle
// count and some non-zero number of steps. Each step has a duration and a
// temperature.
class ThermocycleParametersReadOnly extends React.Component {

  static get propTypes() {
    return {
      mix: PropTypes.string.isRequired,
      groups: PropTypes.arrayOf(
        PropTypes.shape({
          cycles: PropTypes.number,
          steps: PropTypes.arrayOf(
            PropTypes.shape({
              temperature: PropTypes.string,
              gradient: PropTypes.shape({
                top: PropTypes.string,
                bottom: PropTypes.string
              }),
              duration: PropTypes.string
            })
          )
        })
      )
    };
  }

  static get defaultProps() {
    return {
      showErrors: false,
      groups: [
        {
          cycles: 1,
          steps: []
        }
      ]
    };
  }

  hasMultipleGroups() {
    return this.props.groups.length > 1;
  }

  showRead() {
    return !_.includes(NON_DYE_MIXES, this.props.mix);
  }

  render() {
    return (
      <div className="thermocycle-parameters">
        {this.props.groups.map((group, groupIndex) => {
          return (
            <ThermocycleGroupReadOnly
              key={groupIndex} // eslint-disable-line react/no-array-index-key
              group={group}
              showRead={this.showRead()}
            />
          );
        })}
      </div>
    );
  }
}

export default ThermocycleParametersReadOnly;
