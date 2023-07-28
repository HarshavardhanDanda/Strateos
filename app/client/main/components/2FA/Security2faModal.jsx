import React from 'react';
import PropTypes           from 'prop-types';
import { SinglePaneModal } from 'main/components/Modal';

class Security2faModal extends React.Component {

  static get modalId() {
    return 'Enable2faModal';
  }

  render() {
    return (
      <SinglePaneModal
        modalId={Security2faModal.modalId}
        title={this.props.title}
        onAccept={this.props.onAccept}
        acceptText={this.props.acceptText}
        acceptClass={this.props.acceptClass}
        renderFooter={this.props.renderFooter}
        acceptBtnDisabled={this.props.acceptBtnDisabled}
      >
        {this.props.renderContent()}
      </SinglePaneModal>
    );
  }
}

Security2faModal.propTypes = {
  title: PropTypes.string,
  onAccept: PropTypes.func,
  acceptText: PropTypes.string,
  acceptClass: PropTypes.string,
  renderFooter: PropTypes.bool,
  renderContent: PropTypes.func,
  acceptBtnDisabled: PropTypes.bool
};

export default Security2faModal;
