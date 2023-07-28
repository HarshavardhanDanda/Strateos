import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { bindAll } from 'lodash';
import { FormGroup, LabeledInput, TextInput, Button } from '@transcriptic/amino';

import { SinglePaneModal }   from 'main/components/Modal';
import AdminActionsAdminScope from 'main/admin/actions/AdminActions';

const MODAL_ID = 'CreateAdminModalId';

function CreateAdminView({ name, email, onChangeVals, onSubmit, errors = {} }) {
  return (
    <SinglePaneModal
      modalId={MODAL_ID}
    >
      <h3>Create New Admin</h3>
      <div>
        <FormGroup className="tx-stack tx-stack--xlg">
          <LabeledInput
            label="Email"
            error={errors.email ? errors.email[0] : undefined}
          >
            <TextInput
              value={email}
              onChange={(e) => onChangeVals({ email: e.target.value })}
            />
          </LabeledInput>
          <LabeledInput
            label="Full Name"
            error={errors.name ? errors.name[0] : undefined}
          >
            <TextInput
              value={name}
              onChange={(e) => onChangeVals({ name: e.target.value })}
            />
          </LabeledInput>
          <Button onClick={onSubmit}>submit</Button>
        </FormGroup>
      </div>
    </SinglePaneModal>
  );
}
CreateAdminView.propTypes = {
  name: PropTypes.string,
  email: PropTypes.string,
  onChangeVals: PropTypes.func,
  onSubmit:  PropTypes.func,
  errors: PropTypes.object
};

class CreateAdminModal extends Component {
  static get MODAL_ID() {
    return MODAL_ID;
  }

  constructor(props) {
    super(props);
    this.state = {
      email: undefined,
      name: undefined,
      forceValidate: false,
      responseErrors: {}
    };
    bindAll(this, 'onSubmit', 'handleSubmissionFailure');
  }

  localValidate() {
    const { email, name } = this.state;
    const errors = {};
    if (!name) {
      errors.name = ['must specify a name'];
    }
    if (!email) {
      errors.email = ['must specify an email'];
    }
    return errors;
  }

  onSubmit() {
    // If we've detected errors, display the errors and don't submit
    if (Object.keys(this.localValidate()).length > 0) {
      this.setState({ forceValidate: true });
      return;
    }

    // Make request. Reset state.
    const { email, name } = this.state;
    this.setState({ forceValidate: false, responseErrors: {} }, () => {
      const req = AdminActionsAdminScope.create({ email, name });
      req.then((admin) => {
        alert(`Successfuly created admin: ${admin.name}. Tell them to go thrugh the 'Forgot Password' flow.`);
        this.setState({ name: '', email: '' }, this.props.onSuccess());
      });
      req.fail(this.handleSubmissionFailure);
    });
  }

  handleSubmissionFailure(e) {
    if (e.responseJSON.error) {
      alert(e.responseJSON.error);
    } else if (e.responseJSON.errors) {
      this.setState({
        responseErrors: e.responseJSON.errors,
        forceValidate: true
      });
    } else {
      // This is basically an error in our js b/c we sent bad params
      this.setState({ forceValidate: true });
      alert('Failed to save');
    }
  }

  // if they are filling out the form, dont show any errors
  // if we have server errors and they haven't edited the form, show all errors
  render() {
    let errors = {};
    if (this.state.forceValidate) {
      const localErrors = this.localValidate();
      errors = { ...this.state.responseErrors, ...localErrors };
    }
    const { name, email } = this.state;
    return (
      <CreateAdminView
        name={name}
        email={email}
        errors={errors}
        onSubmit={this.onSubmit}
        onChangeVals={(updates) => {
          this.setState({ ...updates, forceValidate: false, responseErrors: {} });
        }}
      />
    );
  }
}

CreateAdminModal.propTypes = {
  onSuccess: PropTypes.func
};

export default CreateAdminModal;
export { CreateAdminView };
