import React from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import Immutable from 'immutable';
import _ from 'lodash';

import {
  Button,
  ButtonGroup,
  Breadcrumbs,
  Column,
  ZeroState,
  TextInput,
  List
} from '@transcriptic/amino';

import Urls from 'main/util/urls';

import { PageLayout, PageHeader }   from 'main/components/PageLayout';
import { TabLayout } from 'main/components/TabLayout';
import { ShipmentModel } from 'main/stores/ShipmentStore';
import ContainerStore from 'main/stores/ContainerStore';
import ContainerTypeStore from 'main/stores/ContainerTypeStore';
import LocationsAPI   from 'main/api/LocationsAPI';
import ContainerAPI from 'main/api/ContainerAPI';

import ContainerActions from 'main/actions/ContainerActions';
import NotificationActions from 'main/actions/NotificationActions';
import ModalActions from 'main/actions/ModalActions';
import ShipmentActions from 'main/actions/ShipmentActions';
import * as ContainerRow from 'main/inventory/ContainerProperties';
import CoverStatusPicker from 'main/inventory/inventory/CoverStatusPicker';
import { LocationAssignmentModal } from 'main/models/LocationSelectorModal/LocationSelectorModal';
import CheckinContainersModal from 'main/inventory/inventory/CheckinContainersModal';
import String from '../../util/String';

import './Containers.scss';

class ContainersTable extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      sortKey: 'Id',
      sortDirection: 'asc',
      selected: {},
      updates: {},
      barcodes: [],
      ids: [],
      locationModalContainer: undefined
    };

    this.barcodeInput = this.barcodeInput.bind(this);
    this.barcodeSave = this.barcodeSave.bind(this);
    this.renderLocation = this.renderLocation.bind(this);
    this.renderBarcode = this.renderBarcode.bind(this);
    this.getContainerType = this.getContainerType.bind(this);
    this.isCheckinDisabled = this.isCheckinDisabled.bind(this);
  }

  componentDidUpdate(prevProps, prevState) {
    if (
      this.props.containers !== prevProps.containers ||
      this.state.sortDirection !== prevState.sortDirection ||
      this.state.sortKey !== prevState.sortKey
    ) {
      this.load();
    }
  }

  load() {
    const containers  = this.sortedContainers(this.props.containers);
    const { ids, barcodes } = this.state;

    containers.forEach((ele, index) => {
      ids[index] = ele.get('id');
      barcodes[index] = ele.get('barcode') || ele.get('suggested_user_barcode');
    });

    this.setState({ ids, barcodes });
  }

  onSelectContainer(container, willBeSelected, selectedRows) {
    this.setState({ selected: selectedRows });
  }

  onSelectAllContainers(selectedRows) {
    this.setState({ selected: selectedRows });
  }

  updateContainers(Locations) {
    const { selected, locationModalContainer } = this.state;
    const containerIds = locationModalContainer ? [locationModalContainer.get('id')] : Object.keys(selected);
    this.setState({ locationModalContainer: undefined });

    if (_.isArray(Locations)) {
      return Locations.forEach((location, index) => {
        ContainerAPI.update(containerIds[index], { location_id: location.get('id') });
      });
    }

    return ContainerActions.updateMany(
      containerIds,
      { location_id: Locations }
    );
  }

  updateContainersCover(cover) {
    const { selected } = this.state;
    const containerIds = Object.keys(selected);

    return ContainerActions.updateMany(
      containerIds,
      { cover }
    );
  }

  coverStatusOptions() {
    const { containers } = this.props;
    const { selected } = this.state;

    let options = [];

    containers.forEach(container => {
      if (!selected[container.get('id')]) {
        return;
      }

      const container_types = [
        ...((ContainerTypeStore.getById(container.get('container_type_id'))).get('acceptable_lids').toJS()),
        'uncovered'
      ];

      options = _.union(options, container_types);
    });

    return options.map(value => ({ value, id: value, label: value }));
  }

  checkinContainers() {
    const { containers, shipment, afterCheckedIn } = this.props;

    const containerIds = [];
    containers.forEach(container => containerIds.push(container.get('id')));

    ShipmentActions.checkinContainers(shipment.id(), containerIds, () => afterCheckedIn(shipment));
  }

  sortedContainers(containers) {
    const { sortKey, sortDirection } = this.state;
    const sortFunction = sortKey === 'Barcode'
      ? this.barcodeForInput
      : ContainerRow[String.upperCamelCase(sortKey)];
    const sortedContainers = containers.sortBy(c => sortFunction(c));
    return sortDirection === 'asc' ? sortedContainers : sortedContainers.reverse();
  }

  isCheckinDisabled(containers) {
    return containers.some((container) => _.isEmpty(container.get('barcode')) && _.isEmpty(container.get('suggested_user_barcode')));
  }

  barcodeInput(e, row) {
    let rowCount = row;
    const inputs = e.target.value.trim().split(/\s+/);
    const { barcodes, updates } = this.state;
    const maxInputs = _.size(barcodes);

    inputs.forEach((input) => {
      if (rowCount < maxInputs) {
        barcodes[rowCount] = input;
        updates[this.state.ids[rowCount++]] = input;
      }
    });

    this.setState({ barcodes, updates });
  }

  barcodeSave() {
    // eslint-disable-next-line no-restricted-syntax
    for (const [id, barcode] of Object.entries(this.state.updates)) {
      ContainerAPI.update(id, { barcode }).fail((...response) => {
        NotificationActions.handleError(...response);
      });
    }

    this.setState({ updates: {} });
  }

  barcodeForInput(container) {
    if (container.get('barcode') != undefined) {
      return container.get('barcode');
    }

    if (container.get('suggested_user_barcode') != undefined) {
      return container.get('suggested_user_barcode');
    }

    return '';
  }

  getContainerType(container) {
    return container.get('container_type_id', '-');
  }

  isSortable(column) {
    if (column === 'Container Type') return false;
    return true;
  }

  renderLocation(container) {
    const truncatedPath = ContainerRow.Location(container);

    if (!React.isValidElement(truncatedPath)) {
      return (
        <Button
          link
          type="primary"
          noPadding
          onClick={() => this.setState({ locationModalContainer: container },
            ModalActions.open(LocationAssignmentModal.MODAL_ID)
          )}
        >
          Assign location
        </Button>
      );
    }

    return truncatedPath;
  }

  renderBarcode(container, row) {
    const barcodeIsSaved = !_.isEmpty(this.barcodeForInput(container));

    return (
      <span onClick={e => e.stopPropagation()}>
        <div className="shipment-container-row__barcode">
          <TextInput
            name="text-input"
            placeholder="Barcode value"
            value={this.state.barcodes[row]}
            onBlur={this.barcodeSave}
            onChange={(e) => this.barcodeInput(e, row)}
            onKeyDown={e => (e.key === 'Enter' ? this.barcodeSave(e) : this.barcodeInput(e))}
          />
        </div>
        <If condition={barcodeIsSaved}>
          <span><i className="fa fa-check" /></span>
        </If>
      </span>
    );
  }

  render() {
    const { selected, locationModalContainer } = this.state;
    const { containers, shipment } = this.props;
    const columns = [
      'Label',
      'Container Type',
      'Code',
      'Storage',
      'Location',
      'Cover',
      'Barcode'
    ];

    if (containers.size === 0) {
      return (
        <ZeroState
          title="No containers to checkin"
          hasBorder
          button={(
            <Link to={Urls.lab_check_in()}>
              <Button>Browse all pending shipments list</Button>
            </Link>
          )}
        />
      );
    }

    const actions = [
      {
        title: 'Location',
        action: () => ModalActions.open(LocationAssignmentModal.MODAL_ID)
      },
      {
        title: 'Cover',
        action: () => ModalActions.open(CoverStatusPicker.MODAL_ID)
      }
    ];

    return (
      <div className="shipments-checkin-containers tx-stack tx-stack--sm">
        <LocationAssignmentModal
          containersCount={locationModalContainer ? 1 : _.size(this.state.selected)}
          updateMultipleLocations={locationIds => this.updateContainers(locationIds)}
          onDismissed={() => this.setState({ locationModalContainer: undefined })}
          labIdForFilter={shipment ? shipment.labId() : undefined}
        />
        <CoverStatusPicker
          options={this.coverStatusOptions()}
          onChange={cover => this.updateContainersCover(cover)}
        />
        <CheckinContainersModal
          onAccept={() => this.checkinContainers()}
          size={containers.size}
          label={shipment.label()}
          organization={shipment.organizationName()}
        />
        <List
          id="containers-table"
          data={this.sortedContainers(containers)}
          loaded
          onSelectRow={(...args) => this.onSelectContainer(...args)}
          onSelectAll={(...args) => this.onSelectAllContainers(...args)}
          selected={selected}
          actions={actions}
          disableCard
        >
          {
            columns.map(column => {
              let render = ContainerRow[String.upperCamelCase(column)];
              if (column === 'Location') render = this.renderLocation;
              if (column === 'Barcode') render = this.renderBarcode;
              if (column === 'Container Type') render = this.getContainerType;
              return (
                <Column
                  renderCellContent={render}
                  header={column}
                  sortable={this.isSortable(column)}
                  onSortChange={this.isSortable(column) ? (sortKey, sortDirection) => this.setState({ sortKey, sortDirection }) : undefined}
                  id={column}
                  key={column}
                />
              );
            })
          }
        </List>
        <div className="shipments-checkin-containers__footer">
          <ButtonGroup>
            <Button link to={Urls.lab_check_in()} type="secondary">Cancel</Button>
            <Button type="primary" disabled={this.isCheckinDisabled(containers)} onClick={() => ModalActions.open(CheckinContainersModal.MODAL_ID)}>Checkin</Button>
          </ButtonGroup>
        </div>
      </div>
    );
  }
}

ContainersTable.propTypes = {
  containers: PropTypes.instanceOf(Immutable.Iterable).isRequired,
  shipment: PropTypes.instanceOf(ShipmentModel).isRequired,
  afterCheckedIn: PropTypes.func
};

function Containers({
  afterCheckedIn,
  shipment
}) {
  const containers = ContainerStore.getByIds(shipment.containerIds())
    .filter(container => container.get('status') !== 'available');

  React.useEffect(() => {
    containers.map((container) => LocationsAPI.loadLocation(container.getIn(['location', 'id'])));
  }, []);

  return (
    <PageLayout
      PageHeader={(
        <PageHeader
          titleArea={(
            <Breadcrumbs>
              <Link to={Urls.lab_check_in()}>Shipments</Link>
              <span>{`${shipment.organizationName()}: ${shipment.label()} (${containers.size} containers)`}</span>
            </Breadcrumbs>
          )}
        />
      )}
    >
      <TabLayout>
        <ContainersTable
          containers={containers}
          shipment={shipment}
          afterCheckedIn={afterCheckedIn}
        />
      </TabLayout>
    </PageLayout>
  );
}

Containers.propTypes = {
  shipment: PropTypes.instanceOf(ShipmentModel).isRequired,
  afterCheckedIn: PropTypes.func
};

export default Containers;
