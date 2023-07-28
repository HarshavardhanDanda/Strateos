import PropTypes from 'prop-types';
import React     from 'react';

import { UnitNames, convertUnitForDisplay, DimensionForUnit } from 'main/util/unit';

class Unit extends React.Component {

  static get propTypes() {
    return {
      value: PropTypes.string.isRequired,
      convertForDisplay: PropTypes.bool
    };
  }

  render() {
    let [value, unit] = Array.from(this.props.value.split(/:/));

    if (this.props.convertForDisplay) {
      const type = DimensionForUnit[unit];
      const [displayValue, displayUnit] = Array.from(convertUnitForDisplay(this.props.value, type).split(/:/));

      value = displayValue;
      unit = displayUnit;
    }
    const unitName = UnitNames[unit];

    if (unitName) {
      return <span>{`${value} ${unitName}`}</span>;
    } else {
      return <span>{`${value}:${unit}`}</span>;
    }
  }
}

export default Unit;
