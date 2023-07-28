import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { SinglePaneModal }   from 'main/components/Modal';
import { Checkbox, Button } from '@transcriptic/amino';
import ModalActions from 'main/actions/ModalActions';
import AdminUserActions from 'main/admin/actions/UserActions';
import './2FAModal.scss';

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
    AdminUserActions.triggerNew2FA(id)
      .always(() => {
        this.onDismiss();
      });
  }

  onDismiss() {
    this.setState({ checked: false });
    ModalActions.close(TriggerNew2FAModal.MODAL_ID);
  }

  renderFooter() {
    return (
      <div className="modal__footer tx-inline tx-inline--md">
        <Button link onClick={this.onDismiss}>Cancel</Button>
        <Button type="danger" size="medium" heavy disabled={!this.state.checked} onClick={this.triggerNew2FA}>
          Trigger New 2FA
        </Button>
      </div>
    );
  }

  render() {
    const { user } = this.props;
    const email = user ? user.get('email') : '';

    return (
      <SinglePaneModal
        title="Trigger new 2FA"
        modalId={TriggerNew2FAModal.MODAL_ID}
        modalSize="medium"
        footerRenderer={() => this.renderFooter()}
        modalClass="2fa-modal__modal"
        closeOnClickOut={false}
        onDismissed={() => this.setState({ checked: false })}
      >
        <div className="tx-stack tx-stack--sm">
          <div>
            <p className="2fa-modal__content">
              {`Triggering new 2FA could aid a security incident.
                Are you sure you want to trigger a new 2FA for this user <${email}>?`}
            </p>
          </div>
          <div className="2fa-modal__checkbox-label">
            <Checkbox
              id="check-box"
              type="checkbox"
              value={this.state.checked}
              checked={this.state.checked ? 'checked' : 'unchecked'}
              onChange={e => this.setState({ checked: e.target.checked })}
            />
            <p className="2fa-modal__label">
              {'I confirm I have verified the user’s identity by confirming their government issued ID'.toUpperCase()}
            </p>
          </div>
        </div>
      </SinglePaneModal>
    );
  }
}

TriggerNew2FAModal.propTypes = {
  user: PropTypes.any.isRequired
};

export default TriggerNew2FAModal;
