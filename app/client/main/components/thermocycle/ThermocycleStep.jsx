import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React     from 'react';

import { LabeledInput, Button, InputWithUnits }  from '@transcriptic/amino';

class TemperatureInput extends React.Component {
  static get propTypes() {
    return {
      error:    PropTypes.string,
      value:    PropTypes.string,
      label:    PropTypes.string.isRequired,
      onChange: PropTypes.func.isRequired
    };
  }

  render() {
    return (
      <div className="col-xs-6">
        <LabeledInput
          className={this.props.error ? 'has-error' : undefined}
          label={this.props.label}
        >
          <InputWithUnits
            dimension="temperature"
            value={this.props.value}
            onChange={e => this.props.onChange(e.target.value)}
          />
          <div className="help-block">{this.props.error}</div>
        </LabeledInput>
      </div>
    );
  }
}

class ThermocycleStep extends React.Component {
  static get propTypes() {
    return {
      stepErrors:       PropTypes.instanceOf(Immutable.Map).isRequired, // takes same shape as step
      isRemovableStep:  PropTypes.bool.isRequired,
      showRead:         PropTypes.bool.isRequired,
      onDeleteStep:     PropTypes.func.isRequired,
      onUpdateStep:     PropTypes.func.isRequired,
      onToggleStepTemp: PropTypes.func.isRequired,
      onToggleStepRead: PropTypes.func.isRequired,
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
                  error={this.props.stepErrors.getIn(['gradient', 'top'])}
                  label="Top Temp"
                  value={this.props.step.gradient.top}
                  onChange={this.props.onUpdateStep(['gradient', 'top'])}
                />
                <TemperatureInput
                  error={this.props.stepErrors.getIn(['gradient', 'bottom'])}
                  label="Bottom Temp"
                  value={this.props.step.gradient.bottom}
                  onChange={this.props.onUpdateStep(['gradient', 'bottom'])}
                />
              </div>
            </When>
            <Otherwise>
              <div className="row">
                <TemperatureInput
                  error={this.props.stepErrors.get('temperature')}
                  label="Temperature"
                  value={this.props.step.temperature}
                  onChange={this.props.onUpdateStep('temperature')}
                />
              </div>
            </Otherwise>
          </Choose>
        </div>
        <div className="col-xs-2 toggle-list">
          <a
            className="toggle-step-option"
            onClick={this.props.onToggleStepTemp(this.isGradient() ? 'uniform' : 'gradient')}
          >
            <Choose>
              <When condition={this.isGradient()}>
                <i className="fa fa-toggle-on" />
              </When>
              <Otherwise><i className="fa fa-toggle-off" /></Otherwise>
            </Choose>
            <small> Gradient</small>
          </a>
          <If condition={this.props.showRead}>
            <a className="toggle-step-option" onClick={this.props.onToggleStepRead}>
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
          <LabeledInput
            label="Time"
            className={
              this.props.stepErrors.get('duration') ? 'has-error' : undefined
            }
          >
            <InputWithUnits
              dimension="time"
              value={this.props.step.duration}
              onChange={e => this.props.onUpdateStep('duration')(e.target.value)}
            />
            <div className="help-block">
              {this.props.stepErrors.get('duration')}
            </div>
          </LabeledInput>
        </div>
        <div className="col-xs-1">
          <If condition={this.props.isRemovableStep}>
            <LabeledInput>
              <div>
                <Button
                  type="primary"
                  link
                  className="btn-remove"
                  onClick={this.props.onDeleteStep}
                  icon="fa fa-times"
                />
              </div>
            </LabeledInput>
          </If>
        </div>
      </div>
    );
  }
}

export default ThermocycleStep;
