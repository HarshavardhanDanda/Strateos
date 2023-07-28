import React from 'react';
import PropTypes from 'prop-types';

import {
  FormGroup,
  Section,
  TextInput,
  Toggle,
  Validated
} from '@transcriptic/amino';

import './EditPredecessorRun.scss';

class EditPredecessorRun extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      editing: !!props.predecessorId,
      predecessorId: props.predecessorId || ''
    };
  }

  onToggleChange(value) {
    this.setState({ editing: value },
      () => {
        this.props.onChange(value ? this.state.predecessorId : undefined);
      }
    );
  }

  onPredecessorIdChange(predecessorId) {
    this.setState({ predecessorId },
      () => {
        this.props.onChange(predecessorId);
      }
    );
  }

  render() {
    return (
      <Section title="Run-Linking (Optional)" className="edit-predecessor-run">
        <div className="edit-predecessor-run__content">
          <div className="edit-predecessor-run__toggle-with-label">
            <Toggle
              name="edit-predecessor-run-toggle"
              value={this.state.editing ? 'on' : 'off'}
              onChange={e => this.onToggleChange(e.target.value === 'on')}
            />
            <span>Link to a predecessor run</span>
          </div>

          {this.state.editing && (
            <Validated error={this.props.error}>
              <FormGroup label="Predecessor Run ID">
                <TextInput
                  value={this.state.predecessorId}
                  onChange={(e) => this.onPredecessorIdChange(e.target.value)}
                />
              </FormGroup>
            </Validated>
          )}
        </div>
      </Section>
    );
  }
}

EditPredecessorRun.propTypes = {
  onChange: PropTypes.func.isRequired,
  predecessorId: PropTypes.string,
  error: PropTypes.string
};

export default EditPredecessorRun;
