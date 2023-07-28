import * as Immutable from 'immutable';
import Papa           from 'papaparse';
import PropTypes      from 'prop-types';
import React          from 'react';
import _              from 'lodash';

import LabConsumerActions from 'main/actions/LabConsumerActions';
import LabConsumerStore   from 'main/stores/LabConsumerStore';

import { ContainerTable }  from 'main/pages/ShipsPage/ReturnShipments/ContainerTable';
import { Button, ButtonGroup, Column, DateTime, Table } from '@transcriptic/amino';
import ReturnShipmentActions from 'main/actions/ReturnShipmentActions';
import { SinglePaneModal } from 'main/components/Modal';
import ModalActions from 'main/actions/ModalActions';

const HEADERS = ['ID', 'Organization', 'Created', 'Courier', 'Containers', 'Tracking', 'Next Action'];

function ShipmentContainersModal(props) {
  return (
    <SinglePaneModal title="Shipment Containers Details" modalId="ShipmentContainersModal" modalSize="large">
      <If condition={props.shipment}>
        <ContainerTable containers={props.shipment.get('containers')} />
      </If>
    </SinglePaneModal>
  );
}

ShipmentContainersModal.propTypes = {
  shipment: PropTypes.instanceOf(Immutable.Map)
};

class CourierPickupsTable extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      activeShipment: undefined,
      labOperatorName: ''
    };

    _.bindAll(
      this,
      'renderId',
      'renderOrganization',
      'renderCreated',
      'renderCourier',
      'renderContainers',
      'renderTracking',
      'renderActions'
    );
  }

  componentDidMount() {
    LabConsumerActions.loadLabsForCurrentOrg().done(() => {
      const firstLabConsumer = LabConsumerStore.getAllForCurrentOrg().first();
      if (firstLabConsumer) {
        this.setState({ labOperatorName: firstLabConsumer.getIn(['lab', 'operated_by_name']) });
      }
    });
  }

  renderId(shipment) {
    return shipment.get('id');
  }

  renderOrganization(shipment) {
    return shipment.getIn(['organization', 'name']);
  }

  renderCreated(shipment) {
    return (
      <DateTime
        timestamp={shipment.get('created_at')}
        format="absolute-format"
      />
    );
  }

  renderCourier(shipment) {
    return shipment.get('carrier');
  }

  renderContainers(shipment) {
    return (
      <span>{shipment.get('containers').count()}
        {' '}
        <a onClick={
          () => {
            this.setState({ activeShipment: shipment }, () => ModalActions.open('ShipmentContainersModal'));
          }}
        >
          Details
        </a>
      </span>
    );
  }

  renderTracking(shipment) {
    return shipment.get('tracking_number');
  }

  renderActions(shipment) {
    const containers = shipment.get('containers').toJS();
    const csv = Papa.unparse(containers);

    return (
      <ButtonGroup orientation="horizontal">
        <Button
          type="secondary"
          onClick={(callback) => {
            if (confirm(`Confirm that this shipment has left ${this.state.labOperatorName}.`)) {
              ReturnShipmentActions.ship(shipment.get('id')).done(callback);
            }
          }}
          icon="fas fa-truck"
          label="Mark as shipped"
          heavy
          link
        />
        <Button
          type="secondary"
          onClick={(callback) => {
            if (confirm('Confirm that you want to cancel this shipment.')) {
              ReturnShipmentActions.cancel(shipment.get('id')).done(callback);
            }
          }}
          icon="fas fa-circle-xmark"
          label="Cancel shipment"
          heavy
          link
        />
        {!!shipment.get('containers').size && (
          <Button
            type="secondary"
            to={`data:text/csvcharset=utf-8,${encodeURI(csv)}`}
            tagLink
            download="containers.csv"
            icon="fas fa-download"
            label="Download contents"
            heavy
            link
          />
        )}
      </ButtonGroup>
    );
  }

  render() {
    const [ID, ORGANIZATION, CREATED, COURIER, CONTAINERS, TRACKING, ACTIONS] = HEADERS;
    return (
      <div>
        <ShipmentContainersModal shipment={this.state.activeShipment} />
        <Table
          id="courier-pickups-table"
          data={this.props.returnShipments}
          loaded
          disabledSelection
        >
          <Column
            id={ID}
            key={ID}
            header={ID}
            renderCellContent={this.renderId}
            disableFormatHeader
          />
          <Column
            id={ORGANIZATION}
            key={ORGANIZATION}
            header={ORGANIZATION}
            renderCellContent={this.renderOrganization}
          />
          <Column
            id={CREATED}
            key={CREATED}
            header={CREATED}
            renderCellContent={this.renderCreated}
          />
          <Column
            id={COURIER}
            key={COURIER}
            header={COURIER}
            renderCellContent={this.renderCourier}
          />
          <Column
            id={CONTAINERS}
            key={CONTAINERS}
            header={CONTAINERS}
            renderCellContent={this.renderContainers}
          />
          <Column
            id={TRACKING}
            key={TRACKING}
            header={TRACKING}
            renderCellContent={this.renderTracking}
          />
          <Column
            id={ACTIONS}
            key={ACTIONS}
            header={ACTIONS}
            renderCellContent={this.renderActions}
          />
        </Table>
      </div>
    );
  }
}

CourierPickupsTable.propTypes = {
  returnShipments: PropTypes.instanceOf(Immutable.Iterable).isRequired
};

export default CourierPickupsTable;
