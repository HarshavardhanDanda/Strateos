import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { SinglePaneModal }   from 'main/components/Modal';
import { Checkbox, TextBody } from '@transcriptic/amino';
import ModalActions from 'main/actions/ModalActions';
import UserActions from 'main/actions/UserActions';

class Reset2FAModal extends Component {
  static get MODAL_ID() {
    return 'Reset2FAModal';
  }

  constructor(props) {
    super(props);

    this.reset2FAattempts = this.reset2FAattempts.bind(this);
    this.onDismiss = this.onDismiss.bind(this);

    this.state = {
      checked: false
    };
  }

  reset2FAattempts() {
    const id = this.props.user.get('id');
    UserActions.resetSecondFactorAttemptsCount(id)
      .always(() => {
        this.onDismiss();
      });
  }

  onDismiss() {
    this.setState({ checked: false });
    ModalActions.close(Reset2FAModal.MODAL_ID);
  }

  render() {
    const { user } = this.props;
    const email = user ? user.get('email') : '';
    return (
      <SinglePaneModal
        title="Reset 2FA Attempts"
        modalId={Reset2FAModal.MODAL_ID}
        modalSize="medium"
        type="danger"
        acceptText="Reset 2FA Attempts"
        onAccept={this.reset2FAattempts}
        beforeDismiss={this.onDismiss}
        acceptBtnDisabled={!this.state.checked}
        modalClass="2fa-modal__modal"
        closeOnClickOut={false}
        onDismissed={() => this.setState({ checked: false })}
      >
        <div className="tx-stack tx-stack--sm">
          <TextBody>
            {`Resetting 2FA attempts could aid a security incident.
                Are you sure you want to reset the 2FA attempts for this user <${email}>?`}
          </TextBody>
          <Checkbox
            id="check-box"
            type="checkbox"
            value={this.state.checked}
            checked={this.state.checked ? 'checked' : 'unchecked'}
            onChange={e => this.setState({ checked: e.target.checked })}
            label={'I confirm that i have verified the user’s identity through government issued id'.toUpperCase()}
            disableFormatLabel
          />
        </div>
      </SinglePaneModal>
    );
  }
}

Reset2FAModal.propTypes = {
  user: PropTypes.any.isRequired
};

export default Reset2FAModal;
