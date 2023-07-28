import PropTypes from 'prop-types';
import React     from 'react';

import { LabeledInput, TextInput } from '@transcriptic/amino';

import RunActions          from 'main/actions/RunActions';
import { SinglePaneModal } from 'main/components/Modal';
import { validators }      from 'main/components/validation';
import SessionStore from 'main/stores/SessionStore';
import FeatureConstants from '@strateos/features';
import ACSControls from 'main/util/AcsControls';
import FeatureStore from 'main/stores/FeatureStore';

// Edit the settings of a Project
class RunSettingsModal extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.save = this.save.bind(this);
    this.calcTitleError = this.calcTitleError.bind(this);

    this.state = {
      title: this.props.runTitle || `Run ${this.props.runId}`
    };
  }

  save() {
    RunActions.update(this.props.projectId, this.props.runId, {
      run: {
        title: this.state.title
      }
    });
  }

  calcTitleError() {
    return validators.non_empty(this.state.title);
  }

  render() {
    const titleError = this.calcTitleError();
    const currentOrg = SessionStore.getOrg();
    const canEditRun = (this.props.organizationId === currentOrg.get('id')) && ACSControls.isFeatureEnabled(FeatureConstants.VIEW_EDIT_RUN_DETAILS);

    return (
      <SinglePaneModal
        modalId="RunSettingsModal"
        title="Run Settings"
        onAccept={this.save}
        acceptText="Save Changes"
        acceptBtnDisabled={(titleError != undefined) || !canEditRun}
      >
        <div className="project-settings">
          <div className="tx-stack tx-stack--md">
            <LabeledInput
              label="Run Name"
              error={titleError || undefined}
            >
              <TextInput
                placeholder={`Run ${this.props.runId}`}
                value={this.state.title}
                autoFocus // eslint-disable-line jsx-a11y/no-autofocus
                onChange={(e) => {
                  return this.setState({
                    title: e.target.value
                  });
                }}
                disabled={!canEditRun}
              />
            </LabeledInput>
            {!!FeatureStore.hasFeatureInLab(FeatureConstants.VIEW_RUNS_IN_LABS, this.props.labId) && (
            <React.Fragment>
              <LabeledInput
                label="Run ID"
              >
                <TextInput
                  value={this.props.runId}
                  disabled
                />
              </LabeledInput>
              <LabeledInput
                label="Organization ID"
              >
                <TextInput
                  value={this.props.organizationId}
                  disabled
                />
              </LabeledInput>
            </React.Fragment>
            )}
          </div>
        </div>
      </SinglePaneModal>
    );
  }
}

RunSettingsModal.propTypes = {
  projectId: PropTypes.string.isRequired,
  runId: PropTypes.string.isRequired,
  runTitle: PropTypes.string.isRequired,
  organizationId: PropTypes.string.isRequired,
  labId: PropTypes.string.isRequired
};

export default RunSettingsModal;
