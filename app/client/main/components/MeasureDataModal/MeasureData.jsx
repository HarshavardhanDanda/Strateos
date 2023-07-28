import PropTypes from 'prop-types';
import React     from 'react';

import { InputWithUnits, Validated } from '@transcriptic/amino';

import './MeasureData.scss';

/**
 * MeasureData is a component that is used to collect a single piece of data. It can be used
 * to collect data for a well, or an entire plate.
 */
class MeasureData extends React.Component {
  constructor(props) {
    super(props);

    this.handleChange = this.handleChange.bind(this);
  }

  handleChange(value, idx) {
    const measurement = this.props.measurements[idx];

    this.props.onInputChanged(
      this.props.refName,
      this.props.well,
      measurement.type,
      value
    );
  }

  checkValue(value, validRange) {
    if (validRange && (!((parseFloat(value) >= validRange.min) && (parseFloat(value) <= validRange.max)))) {
      return `Value not within suggested range of ${validRange.min} to ${validRange.max}.`;
    }

    return false;
  }

  render() {
    return (
      <div className="measure-data form-inline row">
        <div className="measure-data__inputs tx-inline tx-inline--xxs">
          {
            this.props.measurements.map((measurement, idx) => {
              return (
                <div className="measure-data__cell" key={`measurement-${idx}`}>
                  <If condition={this.props.well && (idx === 0)}>
                    <h4>
                      {this.props.well}
                    </h4>
                  </If>
                  <div className="form-group measure-data__input" key={idx}>
                    <Validated
                      warning={this.checkValue(this.props.values[idx], measurement.validRange)}
                      force_validate={this.props.loadedDataFromCSV}
                    >
                      <InputWithUnits
                        preserveUnit
                        dimension={measurement.type}
                        value={`${this.props.values[idx]}:${measurement.dataUnits}`}
                        name={`measure-data-input-${idx}`}
                        onChange={e => this.handleChange(e.target.value, idx)}
                      />
                    </Validated>
                  </div>
                </div>
              );
            })
          }
        </div>
      </div>
    );
  }
}

MeasureData.propTypes = {
  refName:           PropTypes.string.isRequired,
  well:              PropTypes.string,
  measurements:      PropTypes.instanceOf(Array).isRequired,
  onInputChanged:    PropTypes.func.isRequired,
  values:            PropTypes.instanceOf(Array),
  loadedDataFromCSV: PropTypes.bool
};

MeasureData.defaultProps = {
  values: []
};

export default MeasureData;
