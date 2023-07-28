import PropTypes from 'prop-types';
import React from 'react';

import { SinglePaneModal } from 'main/components/Modal';

// Content for the confirmation modal popped when an implementation shipment is created
function ImplementationShipmentConfirmModal(props) {
  return (
    <SinglePaneModal
      title={'Implementation Shipment Checkin'}
      modalId={props.modalId}
    >
      <h2>Shipment Successfully Created</h2>
      <p>
        {'Shipment '}
        <strong>
          {props.shipmentName}
        </strong>
        {' has been created with Accession Number '}
        <strong>
          {props.shipmentAccession}
        </strong>
      </p>
      <p>
        The <strong>#operations</strong> Slack channel will be notified when this shipment has been checked in.
      </p>
    </SinglePaneModal>
  );
}

ImplementationShipmentConfirmModal.propTypes = {
  modalId: PropTypes.string.isRequired,
  shipmentName: PropTypes.string.isRequired,
  shipmentAccession: PropTypes.string.isRequired
};

// Wrap the content in the HOC component to add boilerplate functionality
export default ImplementationShipmentConfirmModal;
