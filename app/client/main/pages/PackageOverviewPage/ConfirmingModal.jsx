import PropTypes from 'prop-types';
import React from 'react';
import { TextInput } from '@transcriptic/amino';

import { SinglePaneModal } from 'main/components/Modal';
import ModalActions from 'main/actions/ModalActions';

/* eslint-disable no-underscore-dangle */
class ConfirmingModal extends React.Component {
  constructor(props, context) {
    super(props, context);

    this.confirmationMatches = this.confirmationMatches.bind(this);
    this.shortName = this.shortName.bind(this);

    this.state = {
      confirm: ''
    };
  }

  confirmationMatches() {
    return this.state.confirm === this.shortName();
  }

  shortName() {
    return this.props._package.get('name').split('.').slice(2).join('.');
  }

  render() {
    return (
      <SinglePaneModal
        modalId={this.props.modalId}
        title={this.props.title}
        acceptBtnClass={`btn ${this.props.btnClass}`}
        acceptBtnDisabled={!this.confirmationMatches()}
        acceptText={this.props.btnText}
        onAccept={() =>
          this.props.onConfirm(() => ModalActions.close(this.props.modalId))}
      >
        <div>
          <p>
            {this.props.prompt}
          </p>
          <p>
            {`Type down the package name (${this.shortName()}) to confirm:`}
          </p>
          <TextInput
            value={this.state.confirm}
            onChange={e => this.setState({ confirm: e.target.value })}
          />
        </div>
      </SinglePaneModal>
    );
  }
}

ConfirmingModal.propTypes = {
  _package: PropTypes.object.isRequired,
  onConfirm: PropTypes.func,
  title: PropTypes.string,
  prompt: PropTypes.string,
  btnText: PropTypes.string,
  btnClass: PropTypes.string,
  modalId: PropTypes.string.isRequired
};

export default ConfirmingModal;
