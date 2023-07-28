import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { SinglePaneModal }   from 'main/components/Modal';
import { Checkbox, TextBody } from '@transcriptic/amino';
import ModalActions from 'main/actions/ModalActions';
import UserActions from 'main/actions/UserActions';

class TriggerNew2FAModal extends Component {
  static get MODAL_ID() {
    return 'TriggerNew2FAModal';
  }

  constructor(props) {
    super(props);

    this.triggerNew2FA = this.triggerNew2FA.bind(this);
    this.onDismiss = this.onDismiss.bind(this);

    this.state = {
      checked: false
    };
  }

  triggerNew2FA() {
    const id = this.props.user.get('id');
    UserActions.triggerNew2FA(id)
      .always(() => {
        this.onDismiss();
      });
  }

  onDismiss() {
    this.setState({ checked: false });
    ModalActions.close(TriggerNew2FAModal.MODAL_ID);
  }

  render() {
    const { user } = this.props;
    const email = user ? user.get('email') : '';

    return (
      <SinglePaneModal
        title="Trigger new 2FA"
        modalId={TriggerNew2FAModal.MODAL_ID}
        modalSize="medium"
        type="danger"
        acceptText="Trigger New 2FA"
        onAccept={this.triggerNew2FA}
        beforeDismiss={this.onDismiss}
        acceptBtnDisabled={!this.state.checked}
        modalClass="2fa-modal__modal"
        closeOnClickOut={false}
        onDismissed={() => this.setState({ checked: false })}
      >
        <div className="tx-stack tx-stack--sm">
          <TextBody>
            {`Triggering new 2FA could aid a security incident.
                Are you sure you want to trigger a new 2FA for this user <${email}>?`}
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

TriggerNew2FAModal.propTypes = {
  user: PropTypes.any.isRequired
};

export default TriggerNew2FAModal;
