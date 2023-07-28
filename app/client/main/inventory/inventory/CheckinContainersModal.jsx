import React from 'react';
import PropTypes from 'prop-types';
import { SinglePaneModal } from 'main/components/Modal';

class CheckinContainersModal extends React.Component {

  static get propTypes() {
    return {
      size: PropTypes.number,
      label: PropTypes.string,
      organization: PropTypes.string,
      onAccept: PropTypes.func
    };
  }

  static get MODAL_ID() {
    return 'CHECKIN_CONTAINERS_MODAL';
  }

  render() {
    const { size, label, organization, onAccept } = this.props;

    return (
      <SinglePaneModal
        title="Checkin Confirmation"
        acceptText="Checkin"
        modalId={CheckinContainersModal.MODAL_ID}
        onAccept={() => onAccept()}
      >
        <p>
          Are you sure you would like to check in
          <strong> {size} container(s)</strong> from shipment
          <strong> {label}, {organization}</strong> ?
        </p>
      </SinglePaneModal>
    );
  }
}

export default CheckinContainersModal;
