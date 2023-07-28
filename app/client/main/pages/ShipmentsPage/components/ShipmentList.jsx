import * as Immutable from 'immutable';
import PropTypes      from 'prop-types';
import React          from 'react';

import ModalActions                from 'main/actions/ModalActions';
import ShipmentActions from 'main/actions/ShipmentActions';

import ContainerStore from 'main/stores/ContainerStore';
import FeatureConstants            from '@strateos/features';
import FeatureStore                from 'main/stores/FeatureStore';
import InboundShipmentSuccessModal from './InboundShipmentSuccessModal';
import ShipmentCard                from './ShipmentCard';

class ShipmentList extends React.Component {
  static get propTypes() {
    return {
      intakeKits: PropTypes.instanceOf(Immutable.Iterable).isRequired,
      shipments: PropTypes.instanceOf(Immutable.Iterable).isRequired,
      onNavigateToContainer: PropTypes.func.isRequired,
      labOperatorName: PropTypes.string,
      inTransitToYou: PropTypes.bool
    };
  }

  static outboundView(intakeKit) {
    const intakeKitItems = intakeKit.get('intake_kit_items').toJS();

    return (
      <ShipmentCard
        key={intakeKit.get('id')}
        className="outbound-shipment"
        createdAt={intakeKit.get('created_at')}
        receivedAt={intakeKit.get('received_at')}
        title={intakeKit.get('name') || 'Unnamed'}
        statusMessage={intakeKit.get('status_message')}
        estDeliveryDate={intakeKit.get('est_delivery_date')}
        trackingNumber={intakeKit.get('tracking_number')}
        carrier={intakeKit.get('carrier')}
        intakeKitItems={intakeKitItems}
      />
    );
  }

  static outboundShipments(outbound) {
    if (outbound.size === 0) {
      return (
        <div className="empty-text">
          When you request an Intake Kit, you&apos;ll track its shipping status here.
        </div>
      );
    }

    return outbound.map(ShipmentList.outboundView);
  }

  constructor(props) {
    super(props);
    this.node = React.createRef();
  }

  componentDidMount() {
    const { inTransitToYou } = this.props;
    if (inTransitToYou && this.node != null && this.node.current != null) {
      this.scrollToInTransitToYouSection();
    }
  }

  scrollToInTransitToYouSection() {
    this.node.current.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }

  incompleteInboundShipments() {
    return this.props.shipments.filter(shipment =>
      !shipment.get('checked_in_at')
    ).sortBy(s =>
      s.get('created_at')
    ).reverse().toList();
  }

  completedInboundShipments() {
    return this.props.shipments.filter(shipment =>
      shipment.get('checked_in_at')
    ).toList();
  }

  incompleteIntakeKits() {
    return this.props.intakeKits.filter(ik =>
      !ik.get('received_at')
    ).sortBy(
      ik => ik.get('created_at')
    ).reverse().toList();
  }

  completedIntakeKits() {
    return this.props.intakeKits.filter(
      ik => !!ik.get('received_at')
    ).toList();
  }

  completed() {
    return this.completedIntakeKits()
      .concat(this.completedInboundShipments())
      .sortBy(s => s.get('created_at'))
      .reverse();
  }

  viewShipment(shipmentId, modalId) {
    ShipmentActions.loadContainers(shipmentId)
      .done(() =>
        ModalActions.open(modalId));
  }

  inboundView(shipment) {
    const id = shipment.get('id');
    const MODAL_ID = `${InboundShipmentSuccessModal.MODAL_ID}_${id}`;

    return (
      <ShipmentCard
        key={id}
        id={id}
        inbound
        className={'inbound-shipment'}
        createdAt={shipment.get('created_at')}
        receivedAt={shipment.get('checked_in_at')}
        creator={shipment.get('user')}
        title={shipment.get('label')}
        actionText={'View Shipment'}
        onAction={() => this.viewShipment(id, MODAL_ID)}
        detailEntries={[
          {
            key: 'Shipment ID:',
            value: <p className="monospace shipment-card__shipment-id">{id}</p>
          }
        ]}
      >
        <InboundShipmentSuccessModal
          modalId={MODAL_ID}
          closeOnClickOut={false}
          shipment={shipment}
          onNavigateToContainer={this.props.onNavigateToContainer}
          containers={ContainerStore.getAllByShipment(
            shipment.get('id'))}
        />
      </ShipmentCard>
    );
  }

  inboundShipments(inbound) {
    if (inbound.size === 0) {
      return (
        <div className="empty-text">
          When you have samples to send from your lab
          to Transcriptic, you&apos;ll track them here.
        </div>
      );
    }

    return inbound.map((shipment) => {
      return this.inboundView(shipment);
    });
  }

  completedShipments(completed) {
    if (completed.size === 0) {
      return (
        <div className="empty-text">
          When your shipments are received they will be shown here.
        </div>
      );
    }

    return completed.map((shipment) => {
      return this.inboundView(shipment);
    });
  }

  render() {
    const { labOperatorName } = this.props;
    const inbound   = this.incompleteInboundShipments();
    const outbound  = this.incompleteIntakeKits();
    const completed = this.completed();

    return (
      <div className="shipment-list">
        {FeatureStore.hasFeature(FeatureConstants.VIEW_IN_TRANSIT_SAMPLE_CONTAINERS_SHIPMENTS) && (
        <div className="shipment-section transit-to-us">
          <h2 className="tx-type--secondary shipment-section-title">
            {`In Transit to ${labOperatorName} (${inbound.size})`}
          </h2>
          <div className="shipment-section-body">
            {this.inboundShipments(inbound)}
          </div>
        </div>
        )}
        {FeatureStore.hasFeature(FeatureConstants.VIEW_INTAKEKIT_SHIPMENTS) && (
        <div ref={this.node} className="shipment-section transit-to-you">
          <h2 className="tx-type--secondary shipment-section-title">
            {`In Transit to You (${outbound.size})`}
          </h2>
          <div className="shipment-section-body">
            {ShipmentList.outboundShipments(outbound)}
          </div>
        </div>
        )}
        {FeatureStore.hasFeature(FeatureConstants.VIEW_INTAKEKIT_SHIPMENTS) && (
        <div className="shipment-section received">
          <h2 className="tx-type--secondary shipment-section-title">
            {`Received (${completed.size})`}
          </h2>
          <div className="shipment-section-body">
            {this.completedShipments(completed)}
          </div>
        </div>
        )}
      </div>
    );
  }
}

export default ShipmentList;
