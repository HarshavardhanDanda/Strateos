import React from 'react';
import PropTypes from 'prop-types';
import Immutable from 'immutable';

import ConnectToStores from 'main/containers/ConnectToStoresHOC';
import { SinglePaneModal } from 'main/components/Modal';
import ModalActions from 'main/actions/ModalActions';

import ShipmentCreatedSuccess from 'main/components/ShipmentCreatedSuccess/ShipmentCreatedSuccess';

const MODAL_ID = 'INBOUND_SHIPMENT_SUCCESS_MODAL';

// Displays a shipment along with its containes.
// This view is used to re-display recently created shipments.
class InboundShipmentSuccessModal extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.onContainerClicked = this.onContainerClicked.bind(this);
  }

  onContainerClicked(containerId) {
    this.props.onNavigateToContainer(containerId);
    return ModalActions.close(this.props.modalId);
  }

  render() {
    return (
      <SinglePaneModal
        modalId={this.props.modalId}
        modalSize="large"
        modalClass="inbound-shipment-success-modal"
        title={this.props.shipment.get('label')}
      >
        <ShipmentCreatedSuccess
          shipment={this.props.shipment}
          containers={this.props.containers}
          onContainerClicked={this.onContainerClicked}
        />
      </SinglePaneModal>
    );
  }
}

InboundShipmentSuccessModal.propTypes = {
  shipment: PropTypes.instanceOf(Immutable.Map),
  modalId: PropTypes.string,
  onNavigateToContainer: PropTypes.func,
  containers: PropTypes.instanceOf(Immutable.Iterable)
};

const ConnectedInboundShipmentSuccessModal = ConnectToStores(
  InboundShipmentSuccessModal,
  () => {}
);
ConnectedInboundShipmentSuccessModal.MODAL_ID = MODAL_ID;

export default ConnectedInboundShipmentSuccessModal;
