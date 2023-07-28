import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React     from 'react';

import ThermocycleStep from 'main/components/thermocycle/ThermocycleStep';
import { LabeledInput, Button, TextInput } from '@transcriptic/amino';

class ThermocycleGroup extends React.Component {
  hasMultipleSteps() {
    return this.props.group.steps.length > 1;
  }

  render() {
    return (
      <div className="thermocycle-group">
        <div className="row thermocycle-steps">
          <div className="col-xs-2">
            <LabeledInput
              className={
                this.props.groupErrors.get('cycles') ? 'has-error' : undefined
              }
              label="Cycles"
            >
              <TextInput
                value={
                  this.props.group.cycles != undefined ? this.props.group.cycles : ''
                }
                onChange={this.props.onUpdateCycles}
              />
              <div className="help-block">
                {this.props.groupErrors.get('cycles')}
              </div>
            </LabeledInput>
          </div>
          <div className="col-xs-10 steps">
            {this.props.group.steps.map((step, stepIndex) => {
              return (
                <ThermocycleStep
                  key={stepIndex}
                  step={step}
                  stepErrors={this.props.groupErrors.getIn(
                    ['steps', stepIndex],
                    Immutable.Map()
                  )}
                  isRemovableStep={this.hasMultipleSteps()}
                  showRead={this.props.showRead}
                  onDeleteStep={this.props.onDeleteStep(stepIndex)}
                  onUpdateStep={this.props.onUpdateStep(stepIndex)}
                  onToggleStepTemp={this.props.onToggleStepTemp(stepIndex)}
                  onToggleStepRead={this.props.onToggleStepRead(stepIndex)}
                />
              );
            })}
            <Button
              type="primary"
              link
              tabIndex="-1"
              onClick={this.props.onAddStep}
              icon="fa fa-sm fa-plus"
            >
              Add Step
            </Button>
          </div>
        </div>
        <If condition={this.props.isRemovableGroup}>
          <div className="remove-group-button">
            <a className="btn-remove" onClick={this.props.onDeleteGroup}>
              <i className="fa fa-times" />
            </a>
          </div>
        </If>
      </div>
    );
  }
}

ThermocycleGroup.propTypes = {
  groupErrors: PropTypes.instanceOf(Immutable.Map).isRequired, // group errors take the same shape as group
  isRemovableGroup: PropTypes.bool.isRequired,
  showRead: PropTypes.bool.isRequired,
  onDeleteGroup: PropTypes.func.isRequired,
  onDeleteStep: PropTypes.func.isRequired,
  onAddStep: PropTypes.func.isRequired,
  onUpdateCycles: PropTypes.func.isRequired,
  onUpdateStep: PropTypes.func.isRequired,
  onToggleStepTemp: PropTypes.func.isRequired,
  onToggleStepRead: PropTypes.func.isRequired,
  group: PropTypes.shape({
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
  }).isRequired
};

export default ThermocycleGroup;
