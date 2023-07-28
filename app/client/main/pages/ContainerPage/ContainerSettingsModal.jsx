import React     from 'react';
import Immutable from 'immutable';
import PropTypes from 'prop-types';

import { LabeledInput, TextInput, Validated } from '@transcriptic/amino';
import ContainerAPI from 'main/api/ContainerAPI';
import { SinglePaneModal } from 'main/components/Modal';
import { validators } from 'main/components/validation';

// Edit the settings of a Project
class ContainerSettingsModal extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.save = this.save.bind(this);
    this.dismiss = this.dismiss.bind(this);
    this.calcTitleError = this.calcTitleError.bind(this);
    this.state = {
      label: this.props.container.get('label') || `Container ${this.props.container.get('id')}`,
      titleError: undefined
    };
  }

  save() {
    ContainerAPI.update(this.props.container.get('id'), {
      label: this.state.label
    });
  }

  dismiss() {
    this.setState({ label: this.props.container.get('label') || `Container ${this.props.container.get('id')}` },
      () => { this.setState({ titleError: this.calcTitleError() }); });
  }

  calcTitleError() {
    return validators.non_empty(this.state.label) || validators.no_commas(this.state.label) || validators.no_slashes(this.state.label) || validators.not_too_long(this.state.label);
  }

  render() {
    return (
      <SinglePaneModal
        modalId="ContainerSettingsModal"
        title="Container Settings"
        onAccept={this.save}
        acceptText="Save Changes"
        acceptBtnDisabled={this.state.titleError !== undefined}
        onDismissed={this.dismiss}
      >
        <div className="container-settings">
          <Validated
            force_validate
            error={this.state.titleError}
          >
            <LabeledInput
              label="Container Name"
            >
              <TextInput
                placeholder={`Container ${this.props.container.get('id')}`}
                value={this.state.label}
                autoFocus // eslint-disable-line jsx-a11y/no-autofocus
                onChange={(e) => {
                  this.setState({
                    label: e.target.value
                  }, () => { this.setState({ titleError: this.calcTitleError() }); });
                }}
              />
            </LabeledInput>
          </Validated>
        </div>
      </SinglePaneModal>
    );
  }
}

ContainerSettingsModal.propTypes = {
  container: PropTypes.instanceOf(Immutable.Map)
};

export default ContainerSettingsModal;
