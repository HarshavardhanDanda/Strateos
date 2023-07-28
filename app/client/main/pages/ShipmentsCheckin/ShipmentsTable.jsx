import React from 'react';
import PropTypes from 'prop-types';
import Immutable from 'immutable';
import Moment from 'moment';
import { ShipmentModel, ShipmentStore }    from 'main/stores/ShipmentStore';
import FeatureStore from 'main/stores/FeatureStore';
import FeatureConstants from '@strateos/features';
import _ from 'lodash';
import {
  Button,
  ButtonGroup,
  Column,
  Select,
  DateTime,
  Pagination,
  Card,
  TopFilterBar,
  List
} from '@transcriptic/amino';

import Urls from 'main/util/urls';
import ShipmentActions from 'main/actions/ShipmentActions';
import ShipmentCheckinStore from 'main/stores/ShipmentCheckinStore';
import ShipmentCheckinActions from 'main/actions/ShipmentCheckinActions';
import ModalActions from 'main/actions/ModalActions';
import ImplementationCheckinModal from 'main/models/ImplementationCheckinModal/ImplementationCheckinModal';
import OrganizationTypeAhead from 'main/pages/InventoryPage/OrganizationFilter';

import './ShipmentsTable.scss';

function CheckinActions({ shipment: _shipment, onDestroy }) {
  const shipment = new ShipmentModel(_shipment);

  const destroyShipment = (e) => {
    e.stopPropagation();
    return BulkDestroyAction({
      selectedShipments: [shipment.id()],
      onDestroy: onDestroy
    }).action();
  };

  if (shipment.isCheckedIn()) {
    return <span>{shipment.checkedInAt()}</span>;
  }
  if (shipment.type() === 'implementation' && shipment.isDeletable()) {
    return (
      <Button
        onClick={destroyShipment}
        type="danger"
        size="small"
        height="short"
        icon="fas fa-trash"
        link
      />
    );
  }

  if (!shipment.isDeletable()) {
    return undefined;
  }

  return (
    <ButtonGroup orientation="horizontal">
      <Button onClick={destroyShipment} type="danger" icon="fas fa-trash" link />
    </ButtonGroup>
  );
}

CheckinActions.propTypes = {
  shipment: PropTypes.instanceOf(Immutable.Map).isRequired
};

export function BulkDestroyAction({ selectedShipments, onDestroy }) {
  const destroyShipments = () => {
    const message = `Destroy ${selectedShipments.length} shipment(s)? WARNING: This will delete all of their containers.`;
    if (confirm(message)) {
      return ShipmentActions.destroyMany(selectedShipments).done(() => {
        ShipmentStore.destroyShipments(selectedShipments);
        onDestroy();
      });
    }
    return false;
  };

  let message;

  if (selectedShipments.length == 0) {
    message = 'Destroy shipments';
  } else if (selectedShipments.length == 1) {
    message = 'Destroy 1 shipment';
  } else {
    message = `Destroy ${selectedShipments.length} shipments`;
  }

  return {
    title: message,
    action: destroyShipments,
    icon: 'far far-trash-alt'
  };
}

const onClickShipment = (history, shipment) => {
  // Trigger react router.
  history.push(Urls.lab_shipments_id(shipment.get('id')));
};

function Code(shipment) {
  return shipment.get('implementation') ? <span>{shipment.get('label')} <i className="fa fa-box-heart" /></span> : shipment.get('label');
}

function Organization(shipment) {
  return shipment.get('organization');
}

function labName(labs, shipment) {
  var labsName = '';
  labs.labs && labs.labs.forEach((lab) => {
    if (lab.value == shipment.get('labId')) {
      labsName = lab.name;
    }
  });
  return labsName;
}

function DateCreated(shipment) {
  return <DateTime timestamp={shipment.get('createdAt')} />;
}

function Containers(shipment) {
  return shipment.get('total') ? shipment.get('total') : 'N/A';
}

function Status(shipment) {
  return shipment.get('checkedInAt') ? 'Checked In' : 'Pending';
}

function Remaining(history, shipment) {
  if (shipment.get('remaining') === undefined) {
    return 'N/A';
  }

  return shipment.get('remaining');
}

function Actions(shipment, onDestroy) {
  return <CheckinActions shipment={shipment} onDestroy={onDestroy} />;
}

class ShipmentsTable extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      selected: {},
      organization: undefined,
      date: undefined,
      checkInStatus: undefined,
      shipmentType: undefined,
      statuses: [
        { name: 'Pending', value: 'pending' },
        { name: 'Checked In', value: 'completed' },
        { name: 'Any Status', value: 'pending,completed' }],
      shipments: props.shipments
    };

    this.onRowClick = this.onRowClick.bind(this);
    this.onDestroy = this.onDestroy.bind(this);
  }

  onSelectShipment(shipment, willBeSelected, selectedRows) {
    this.setState({ selected: selectedRows });
  }

  onSelectAllShipments(selectedRows) {
    this.setState({ selected: selectedRows });
  }

  onDestroy() {
    this.setState({ selected: {} });
  }

  onRowClick(shipment) {

    const shipmentId = shipment.get('id');
    if (shipment.get('implementation')) {
      ShipmentCheckinActions.selectShipment(shipmentId);
      ModalActions.open('ImplementationCheckinModal');
    } else {
      onClickShipment(this.props.history, shipment);
    }
  }

  matchState(value, stateValue, defaultValue) {
    if (stateValue) {
      if (defaultValue && stateValue === defaultValue) {
        return true;
      } else {
        return value === stateValue;
      }
    } else {
      return true;
    }
  }

  render() {
    const { history, shipmentToContainers } = this.props;

    const  labs  = this.props;

    const shipments = this.props.shipments
      .map((s) => {
        let total;
        let remaining;
        if (s.type() === 'sample') {
          const containers = shipmentToContainers.get(s.id());
          total = containers.size;
          // this filter needs to be fixed when return shipment lab_id is properly mapped
          remaining = containers.filter(c => !!c).count(c => c.get('status') === 'inbound');
        }
        return Immutable.fromJS({
          id: s.id(),
          implementation: s.type() === 'implementation',
          label: s.label(),
          organization: s.type() === 'implementation' ? 'Implementation Shipment' : s.organizationName(),
          labId: s.labId(),
          createdAt: s.createdAt(),
          total,
          remaining,
          checkedInAt: s.checkedInAt() ? Moment(new Date(s.checkedInAt())).format('MMM D, YYYY') : undefined,
          action: Object.assign(s, { remainingContainers: remaining })
        });
      });

    const defaultStatus = 'Any Status';

    const table = (
      <div style={{ marginBottom: '1em' }}>
        <List
          loaded={!_.isNil(shipments) && !this.props.loading}
          data={shipments}
          id="CheckinShipments"
          onSelectRow={(...args) => this.onSelectShipment(...args)}
          onSelectAll={(...args) => this.onSelectAllShipments(...args)}
          selected={this.state.selected}
          onRowClick={(...args) => {  this.onRowClick(...args); }}
          disableCard
          actions={[
            BulkDestroyAction({
              selectedShipments: Object.keys(this.state.selected),
              onDestroy: this.onDestroy
            })
          ]}
        >
          <Column renderCellContent={Code} header="Code" id="code" />
          <Column renderCellContent={Organization} header="Organization"  id="organization" />
          <Column renderCellContent={(...args) => labName(labs, ...args)} header="Lab" id="lab" />
          <Column renderCellContent={Status} header="Checked In Status" id="checked-in-status" />
          <Column renderCellContent={DateCreated} header="Date"id="date" />
          <Column renderCellContent={Containers} header="Containers" id="containers" />
          <Column renderCellContent={(...args) => Remaining(history, ...args)} header="Remaining" id="remaining" />
          <Column renderCellContent={(shipment) => Actions(shipment, this.onDestroy)} header="Actions" id="actions" />
        </List>
      </div>
    );

    const selectedShipment = ShipmentCheckinStore.selectedShipment();
    const isSelectedCheckedIn = selectedShipment && selectedShipment.isCheckedIn();

    return (
      <React.Fragment>
        <Card className="shipments-table">
          <ImplementationCheckinModal
            modalId={'ImplementationCheckinModal'}
            shipment={selectedShipment}
            checkingIn={!isSelectedCheckedIn}
            modalTitle={'Implementation Shipment Details'}
            labs={this.props.labs}
            onCheckin={this.props.onCheckin}
          />
          <div className="shipments-table__filters">
            <TopFilterBar>
              {this.props.showOrgFilter && (
                <TopFilterBar.Wrapper grow={false}>
                  <OrganizationTypeAhead
                    onOrganizationChange={(organization_id) => {
                      this.props.onSelectFilter({ organization_id });
                      this.setState({ organization: organization_id });
                    }}
                    defaultWidth
                  />
                </TopFilterBar.Wrapper>
              )}
              <TopFilterBar.Wrapper>
                <Select
                  placeholder={defaultStatus}
                  options={this.state.statuses}
                  value={this.state.checkInStatus}
                  onChange={e => {
                    const checkInStatus = e.target.value;
                    this.props.onSelectFilter({ checked_in: checkInStatus });
                    this.setState({ checkInStatus });
                  }}
                />
              </TopFilterBar.Wrapper>
              {!!FeatureStore.getLabIdsWithFeatures(FeatureConstants.MANAGE_IMPLEMENTATION_SHIPMENTS).size && (
                <TopFilterBar.Wrapper>
                  <Select
                    placeholder={'Shipment type'}
                    options={[
                      { name: 'Implementation', value: 'implementation' },
                      { name: 'Sample', value: 'sample' },
                      { name: 'All', value: 'implementation,sample' }]
                    }
                    value={this.state.shipmentType}
                    onChange={e => {
                      const shipmentType = e.target.value;
                      this.props.onSelectFilter({ shipment_type: shipmentType });
                      this.setState({ shipmentType });
                    }}
                  />
                </TopFilterBar.Wrapper>
              )}
            </TopFilterBar>
          </div>
          {table}
        </Card>
        <If condition={!this.props.loading && this.props.numPages}>
          <div className="shipments-table__pagination">
            <Pagination
              page={this.props.page}
              pageWidth={10}
              numPages={this.props.numPages}
              onPageChange={this.props.onPageChange}
            />
          </div>
        </If>

      </React.Fragment>
    );
  }
}

ShipmentsTable.propTypes = {
  shipments: PropTypes.instanceOf(Immutable.Iterable).isRequired,
  shipmentToContainers: PropTypes.instanceOf(Immutable.Map),
  history: PropTypes.object,
  onCheckin: PropTypes.func,
  showOrgFilter: PropTypes.bool
};

export default ShipmentsTable;
