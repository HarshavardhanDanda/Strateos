import PropTypes from 'prop-types';
import React     from 'react';

import { LabeledInput, InputWithUnits }  from '@transcriptic/amino';

class TemperatureInput extends React.Component {
  static get propTypes() {
    return {
      value:    PropTypes.string,
      label:    PropTypes.string.isRequired
    };
  }

  render() {
    return (
      <div className="col-xs-6">
        <LabeledInput label={this.props.label}>
          <InputWithUnits
            name={''}
            dimension="temperature"
            value={this.props.value}
            disabled
            preserveUnit
          />
        </LabeledInput>
      </div>
    );
  }
}

class ThermocycleStepReadOnly extends React.Component {
  static get propTypes() {
    return {
      showRead:         PropTypes.bool.isRequired,
      step:             PropTypes.shape({
        temperature:    PropTypes.string,
        read:           PropTypes.bool,
        gradient:       PropTypes.shape({
          top:          PropTypes.string,
          bottom:       PropTypes.string
        }),
        duration: PropTypes.string
      }).isRequired
    };
  }

  isGradient() {
    return this.props.step.gradient != undefined;
  }

  isRead() {
    return this.props.step.read;
  }

  render() {
    return (
      <div className="row">
        <div className="col-xs-6">
          <Choose>
            <When condition={this.isGradient()}>
              <div className="row">
                <TemperatureInput
                  label="Top Temp"
                  value={this.props.step.gradient.top}
                />
                <TemperatureInput
                  label="Bottom Temp"
                  value={this.props.step.gradient.bottom}
                />
              </div>
            </When>
            <Otherwise>
              <div className="row">
                <TemperatureInput
                  label="Temperature"
                  value={this.props.step.temperature}
                />
              </div>
            </Otherwise>
          </Choose>
        </div>
        <div className="col-xs-2 toggle-list">
          <a className="toggle-step-option">
            <Choose>
              <When condition={this.isGradient()}>
                <i className="fa fa-toggle-on" />
              </When>
              <Otherwise><i className="fa fa-toggle-off" /></Otherwise>
            </Choose>
            <small> Gradient</small>
          </a>
          <If condition={this.props.showRead}>
            <a className="toggle-step-option">
              <Choose>
                <When condition={this.isRead()}>
                  <i className="fa fa-toggle-on" />
                </When>
                <Otherwise><i className="fa fa-toggle-off" /></Otherwise>
              </Choose>
              <small> Read</small>
            </a>
          </If>
        </div>
        <div className="col-xs-3">
          <LabeledInput label="Time">
            <InputWithUnits
              name={''}
              dimension="time"
              value={this.props.step.duration}
              disabled
              preserveUnit
            />
          </LabeledInput>
        </div>
      </div>
    );
  }
}

export default ThermocycleStepReadOnly;
