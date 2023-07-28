import React, { Component } from 'react';
import { SinglePaneModal }   from 'main/components/Modal';
import { TextTitle } from '@transcriptic/amino';
import ModalActions from 'main/actions/ModalActions';
import NotificationActions from 'main/actions/NotificationActions';
import UserActions from 'main/actions/UserActions';

export class ForcePasswordResetModal extends Component {
  static get MODAL_ID() {
    return 'ForcePasswordResetModal';
  }

  constructor(props) {
    super(props);

    this.forcePasswordReset = this.forcePasswordReset.bind(this);
  }

  forcePasswordReset() {
    const id = this.props.user.get('id');
    UserActions.forcePasswordReset(id)
      .done(() => {
        NotificationActions.createNotification({
          text: 'Force Password Reset is successful',
          isError: false
        });
      })
      .always(() => {
        ModalActions.close(ForcePasswordResetModal.MODAL_ID);
      });
  }

  render() {
    const { user } = this.props;
    const email = user ? user.get('email') : '';

    return (
      <SinglePaneModal
        title="Force Password Reset"
        modalBodyClass="force-password-reset__body"
        modalId={ForcePasswordResetModal.MODAL_ID}
        modalSize="medium"
        acceptText="Submit"
        onAccept={() => { this.forcePasswordReset(); }}
      >
        <TextTitle tag="h4" branded={false}>
          {`Are you sure you want to reset password of user <${email}>?`}
        </TextTitle>
      </SinglePaneModal>
    );
  }
}

export default ForcePasswordResetModal;
