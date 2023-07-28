import * as Immutable from 'immutable';
import PropTypes from 'prop-types';
import React from 'react';

import { Button } from '@transcriptic/amino';

import ShipmentActions from 'main/actions/ShipmentActions';
import { ShipmentModel } from 'main/stores/ShipmentStore';
import ConnectToStoresHOC from 'main/containers/ConnectToStoresHOC';
import { SinglePaneModal } from 'main/components/Modal';
import ImplementationItemStore from 'main/admin/stores/ImplementationItemStore';
import ImplementationShipmentCreator from 'main/pages/ShipsPage/ImplementationShipmentCreator';
import _ from 'lodash';
import ImplementationItemAPI from '../../api/ImplementationItemAPI';

// Modal for checking in an implementation shipment
class ImplementationCheckinModal extends React.Component {

  static get propTypes() {
    return {
      shipment: PropTypes.instanceOf(ShipmentModel),
      items: PropTypes.instanceOf(Immutable.Iterable),
      checkingIn: PropTypes.bool,
      modalTitle: PropTypes.string,
      modalId: PropTypes.string,
      onCheckin: PropTypes.func
    };
  }

  static get defaultProps() {
    return { checkingIn: true };
  }

  static generateShipmentPackage(shipment) {
    return {
      title: shipment ? shipment.name() : '',
      note: shipment ? shipment.note() : '',
      receiving_note: shipment ? shipment.receiving_note() : '',
      ps_attachment_url: shipment ? shipment.packingUrl() : undefined,
      psFile: undefined,
      force_validate: false,
      lab_id: shipment ? shipment.labId() : undefined
    };
  }

  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      package: {}
    };

    _.bindAll(
      this,
      'numItemsReceived',
      'onDone',
      'renderFooterButton',
      'updatePackage',
      'onOpen',
    );
  }

  componentDidMount() {
    if (this.props.shipment) {
      this.loadImplementationItems(this.props.shipment.id());
    }
  }

  componentDidUpdate(prevProps) {
    const prevId = prevProps.shipment && prevProps.shipment.id();
    const currId = this.props.shipment && this.props.shipment.id();

    if (currId && currId !== prevId) {
      this.loadImplementationItems(currId);
    }
  }

  // fired when the modal is closed with the action button, not with the 'x'
  // or by clicking in the boundaries
  onDone(onDismiss) {
    const { checkingIn, items, shipment, onCheckin } = this.props;
    // If this isn't being checked in, just dismiss the modal.
    if (!checkingIn) {
      onDismiss();
      return;
    }
    // if items have been marked as received, the shipment isn't yet checked in,
    // and it is currently being checked in, check it in and notify ops
    if ((this.numItemsReceived() === items.size) && !shipment.isCheckedIn()) {
      ShipmentActions.checkin(shipment.id()).done(() => {
        if (onCheckin) { this.props.onCheckin(); }
      });
    } else if (this.numItemsReceived()) {
      ShipmentActions.partial_checkin(shipment.id());
    }
    onDismiss();
  }

  getConfirmButtonText(numItemsReceived) {
    if (numItemsReceived && this.props.checkingIn && !this.props.shipment.isCheckedIn()) {
      if (numItemsReceived === this.props.items.size) {
        return 'Check In Shipment';
      }
      return `Check In ${numItemsReceived} Item${(numItemsReceived > 1) ? 's' : ''}`;
    }
    return 'Done';
  }

  loadImplementationItems(shipmentID) {
    ImplementationItemAPI.selectShipment(shipmentID).always(() => {
      return this.setState({ loading: false });
    });
  }

  // Return the number of items marked as received. If all are marked, return True
  numItemsReceived() {
    const numItems = this.props.items.reduce(
      (acc, item) => { return acc + (item.get('checked_in_at') ? 1 : 0); },
      0
    );
    return numItems;
  }

  updatePackage(key, value) {
    this.setState((state) => { return { package: _.set(state.package, key, value) }; });
  }

  onOpen() {
    this.setState({ package: ImplementationCheckinModal.generateShipmentPackage(this.props.shipment) });
  }

  renderFooterButton(onDismiss) {
    const numItemsReceived = this.numItemsReceived();
    return (
      <div className="modal__footer">
        {/*
          If more than 0 items are marked as received
          and the checkingIn prop is set to true, render this as a primary button style
          If no items have been received or the checkingIn prop has been set to false,
          render the button in default style
        */}
        <Button
          type={numItemsReceived && this.props.checkingIn && !this.props.shipment.isCheckedIn() ? 'primary' : 'secondary'}
          onClick={() => { this.onDone(onDismiss); }}
        >{
            // if items have been received and we're checking in,
            // render "Check In" text, otherwise render "Done"
            this.getConfirmButtonText(numItemsReceived)
          }
        </Button>
      </div>
    );
  }

  render() {
    return (
      <SinglePaneModal
        title={this.props.modalTitle || 'Implementation Shipment Checkin'}
        modalId={this.props.modalId}
        footerRenderer={this.renderFooterButton}
        modalSize="large"
        onOpen={this.onOpen}
      >
        <ImplementationShipmentCreator
          shipment={this.props.shipment}
          items={this.props.items}
          package={this.state.package}
          updatePackage={this.updatePackage}
          loading={this.state.loading}
          checkingIn={this.props.checkingIn}
          labs={this.props.labs}
        />
      </SinglePaneModal>
    );
  }
}

const getStateFromStores = (props) => {
  const shipmentID = props.shipment ? props.shipment.id() : undefined;
  const items = ImplementationItemStore.getItemsByShipmentID(shipmentID);
  return { shipment: props.shipment, items: items };
};

export default ConnectToStoresHOC(ImplementationCheckinModal, getStateFromStores);
