import React from 'react';
import PropTypes from 'prop-types';
import Immutable from 'immutable';
import _ from 'lodash';

import { InputsController, LabeledInput, TextInput, Validated, Toggle, Icon, Tooltip } from '@transcriptic/amino';
import FeatureConstants from '@strateos/features';

import { SimpleInputsValidator, validators } from 'main/components/validation';
import OrganizationTypeAhead from 'main/pages/InventoryPage/OrganizationFilter';
import AcsControls from 'main/util/AcsControls';
import PaymentMethodSelector from 'main/components/PaymentMethodSelector';
import ProjectActions from 'main/actions/ProjectActions';
import { SinglePaneModal } from 'main/components/Modal';
import BSLSettings from 'main/project/settings/BSLSettings';

import './CreateOrEditProjectModal.scss';

class CreateOrEditProjectModal extends React.Component {
  static getDerivedStateFromProps(nextProps, prevState) {
    if (!nextProps.isCreateModal) {
      const currentProject = nextProps.project;

      if (currentProject && !_.isEqual(prevState.project.toJS(), currentProject.toJS())) {
        return {
          project: currentProject,
          projectName: currentProject.get('name'),
          paymentMethod: currentProject.get('payment_method_id'),
          webhookURL: currentProject.get('webhook_url'),
          bsl: currentProject.get('bsl')
        };
      }
    }
  }

  constructor(props) {
    super(props);

    this.state = this.createDefaultStateFromProps(props);

    this.create = this.create.bind(this);
    this.update = this.update.bind(this);
    this.onChangeInputController = this.onChangeInputController.bind(this);
  }

  createDefaultStateFromProps(props) {
    return {
      project: props.project,
      projectName: props.project && props.project.get('name'),
      paymentMethod: props.project && props.project.get('payment_method_id'),
      webhookURL: props.project && props.project.get('webhook_url'),
      bsl: (props.project && props.project.get('bsl')) || 1,
      implementationToggle: 'off',
      orgId: ''
    };
  }

  validator() {
    return SimpleInputsValidator({
      projectName: { validators: [validators.non_empty] },
      webhookURL: { validators: [validators.url], optional: true },
      ...((this.state.implementationToggle === 'on') && { orgId: { validators: [validators.non_empty] } })
    });
  }

  create() {
    const payload = {
      ...(this.state.implementationToggle === 'off' && {
        payment_method_id: this.state.paymentMethod
      }),
      bsl: this.state.bsl,
      webhook_url: this.state.webhookURL,
      ...(this.state.implementationToggle !== 'off' && {
        organization_id: this.state.orgId,
        is_implementation: this.state.implementationToggle !== 'off'
      })
    };
    return ProjectActions.create(this.state.projectName, payload)
      .done((project) => { this.props.onSubmitDone(project.id); });
  }

  update() {
    return ProjectActions.update(this.props.project.get('id'), {
      name: this.state.projectName,
      webhook_url: this.state.webhookURL,
      payment_method_id: this.state.paymentMethod,
      bsl: this.state.bsl
    });
  }

  onChangeInputController(state) {
    const orgId = state.implementationToggle === 'off' ? '' : this.state.orgId;
    this.setState(_.set(state, 'orgId', orgId));
  }

  isImplmentationProject() {
    return this.props.project && this.props.project.get('is_implementation');
  }

  render() {
    const errors = this.validator().errors(Immutable.Map(this.state));

    return (
      <SinglePaneModal
        title={this.props.isCreateModal ? 'Create New Project' : 'Update Project Settings'}
        modalId={this.props.isCreateModal ? 'CreateProjectModal' : 'EditProjectModal'}
        closeOnClickOut
        postDismiss={() => {
          this.setState(this.createDefaultStateFromProps(this.props));
        }}
        onAccept={this.props.isCreateModal ? this.create : this.update}
        modalSize="medium"
        acceptBtnDisabled={!this.validator().isValid(Immutable.Map(this.state))}
      >
        <InputsController
          inputChangeCallback={(state) => this.onChangeInputController(state)}
          defaultState={{
            projectName: this.state.projectName,
            webhookURL: this.state.webhookURL,
            implementationToggle: this.state.implementationToggle
          }}
        >
          <div className="tx-stack tx-stack--md">
            { this.props.isCreateModal && AcsControls.isFeatureEnabled(FeatureConstants.MANAGE_IMPLEMENTATION_PROJECTS_IN_LAB)
              &&  (
              <React.Fragment>
                <div className="create-or-edit-project-modal">
                  <div className="create-or-edit-project-modal__implementation-toggle">
                    <Toggle
                      value={this.state.implementationToggle}
                      name="implementationToggle"
                      size="large"
                    />
                  </div>
                  <div className="create-or-edit-project-modal__implementation-toggle-label">
                    Implementation project &nbsp;
                    <Tooltip
                      placement="top"
                      title="This project is not shown to the client organization by default and is used for testing purposes."
                    >
                      <Icon icon="fa-regular fa-circle-info" />
                    </Tooltip>
                  </div>
                </div>
                { this.state.implementationToggle === 'on' &&  (
                <LabeledInput label="Organization">
                  <Validated error={errors.orgId}>
                    <OrganizationTypeAhead
                      searchIcon="fa-thin fa-building"
                      onOrganizationChange={(orgId) => this.setState({ orgId })}
                    />
                  </Validated>
                </LabeledInput>
                )}
              </React.Fragment>
              )}
            <LabeledInput label="Project Name">
              <Validated error={errors.projectName}>
                <TextInput name="projectName" />
              </Validated>
            </LabeledInput>
            <BSLSettings
              onChange={bsl =>
                this.setState({
                  bsl
                })}
              bsl={this.state.bsl}
              minBSL={1}
            />
            {(this.state.implementationToggle === 'off' && !this.isImplmentationProject()) && (
              <LabeledInput label="Payment Method">
                <PaymentMethodSelector
                  onPaymentMethodSelected={paymentMethod =>
                    this.setState({
                      paymentMethod
                    })}
                  paymentMethodId={this.state.paymentMethod}
                />
              </LabeledInput>
            )}
            <LabeledInput
              label="Webhook URL"
              tip={`Webhooks allow you to set up integrations which subscribe to events on the Strateos platform.
                When one of these events occurs, we will send an HTTP POST to the specified webhook URL.`}
            >
              <Validated error={errors.webhookURL}>
                <TextInput name="webhookURL" />
              </Validated>
            </LabeledInput>
          </div>
        </InputsController>
      </SinglePaneModal>
    );
  }
}

CreateOrEditProjectModal.propTypes = {
  onSubmitDone: PropTypes.func,
  isCreateModal: PropTypes.bool,
  project: PropTypes.instanceOf(Immutable.Map)
};

export default CreateOrEditProjectModal;
