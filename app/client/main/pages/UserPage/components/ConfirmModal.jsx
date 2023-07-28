import _                   from 'lodash';
import { SinglePaneModal } from 'main/components/Modal';
import PropTypes           from 'prop-types';
import React               from 'react';

import { LabeledInput, TextInput, InputsController }  from '@transcriptic/amino';

class ConfirmModal extends React.Component {

  static get propTypes() {
    return {
      title: PropTypes.string.isRequired,
      email: PropTypes.string.isRequired,
      onSubmit: PropTypes.func.isRequired
    };
  }

  constructor(props) {
    super(props);
    this.state = {
      password: ''
    };
  }

  render() {
    return (
      <SinglePaneModal
        modalId="ConfirmModal"
        title={this.props.title}
        onAccept={() => this.props.onSubmit(this.state.password)}
        acceptText="Confirm"
        acceptClass="btn btn-primary"
      >
        <p className="user-page__confirm-p">
          You have changed your email address. To confirm that you want to change the address to{' '}
          <span className="tx-type--heavy">{this.props.email}</span>{' '}
          please enter your password.
        </p>
        <div className="user-page__text-input-wrapper">
          <InputsController
            values={{ password: this.state.password }}
            inputChangeCallback={state => this.setState(state)}
          >
            <LabeledInput label="Current Password">
              <TextInput
                type="password"
                name="password"
              />
            </LabeledInput>
          </InputsController>
        </div>

      </SinglePaneModal>
    );
  }

}

export default ConfirmModal;
