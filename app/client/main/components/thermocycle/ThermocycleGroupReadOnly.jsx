import PropTypes from 'prop-types';
import React     from 'react';

import ThermocycleStepReadOnly from 'main/components/thermocycle/ThermocycleStepReadOnly';
import { LabeledInput, TextInput } from '@transcriptic/amino';

class ThermocycleGroupReadOnly extends React.Component {

  render() {
    return (
      <div className="thermocycle-group">
        <div className="row thermocycle-steps">
          <div className="col-xs-2">
            <LabeledInput label="Cycles">
              <TextInput
                value={this.props.group.cycles}
                disabled
              />
            </LabeledInput>
          </div>
          <div className="col-xs-10 steps">
            {this.props.group.steps.map((step, stepIndex) => {
              return (
                <ThermocycleStepReadOnly
                  key={stepIndex}
                  step={step}
                  showRead={this.props.showRead}
                />
              );
            })}
          </div>
        </div>
      </div>
    );
  }
}

ThermocycleGroupReadOnly.propTypes = {
  showRead: PropTypes.bool.isRequired,
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

export default ThermocycleGroupReadOnly;
