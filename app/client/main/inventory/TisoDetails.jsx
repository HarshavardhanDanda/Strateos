import Classnames     from 'classnames';
import Immutable      from 'immutable';
import $              from 'jquery';
import _              from 'lodash';
import PropTypes      from 'prop-types';
import React          from 'react';
import ReactDOMServer from 'react-dom/server';

import { Section }            from '@transcriptic/amino';
import LocationActions        from 'main/actions/LocationActions';
import TisoReservationActions from 'main/actions/TisoReservationActions';
import TisoReservationStore   from 'main/stores/TisoReservationStore';
import { Loading }            from 'main/components/page';
import ContainerStore         from 'main/stores/ContainerStore';
import LocationStore          from 'main/stores/LocationStore';
import DeviceStore            from 'main/stores/DeviceStore';

class TisoDetails extends React.Component {

  static get propTypes() {
    return {
      location: PropTypes.instanceOf(Immutable.Map).isRequired,
      showContainer: PropTypes.func.isRequired,
      navigateLocation: PropTypes.func.isRequired,
      selectedContainer: PropTypes.instanceOf(Immutable.Map)
    };
  }

  componentWillMount() {
    let location;
    if (this.getTisoCategory() === 'tiso_column') {
      LocationActions.loadLocation(this.props.location.get('parent_id'));
      location = this.props.location.get('ancestors').last();
    } else {
      ({ location } = this.props);
    }

    LocationActions.loadDeepContainers(location.get('id'));
    TisoReservationActions.search({
      location_id: location.get('id')
    });
  }

  componentDidUpdate(prevProps, _prevState) {
    if (prevProps.location.get('id') === this.props.location.get('id')) {
      return;
    }

    // Update newly added tiso column
    const children = this.parentLocation().get('children');
    if (
      this.getTisoCategory() === 'tiso_column' &&
      children &&
      !this.parentChildrenContainsLocation(children)
    ) {
      LocationActions.loadLocation(this.props.location.get('parent_id'));
    }
  }

  getTisoCategory() {
    return this.props.location.getIn(['location_type', 'category']);
  }

  getTisoLocation() {
    if (this.getTisoCategory() === 'tiso_column') {
      return this.parentLocation();
    } else {
      return this.props.location;
    }
  }

  parentLocation() {
    return LocationStore.location(this.props.location.get('parent_id'));
  }

  parentChildrenContainsLocation(children) {
    return children.find(
      location => location.get('id') === this.props.location.get('id')
    );
  }

  tisoReservations(location) {
    const deviceIds = DeviceStore.getAllByLocationId(location.get('id')).map(device => device.get('id'));
    return TisoReservationStore.getAllByDeviceIds(deviceIds);
  }

  tisoContainers(location) {
    const tisoColumnLocationIds = location
      .toJS()
      .children.map(child => child.id);
    return ContainerStore.containersAt(tisoColumnLocationIds);
  }

  render() {
    const location_type = this.getTisoCategory();
    if (location_type === 'tiso_column' && !this.parentLocation()) {
      return <Loading />;
    }

    const tisoLocation = this.getTisoLocation();
    if (
      tisoLocation.get('children') &&
      !tisoLocation.get('children').isEmpty()
    ) {
      const tisoColumnLocations = tisoLocation
        .get('children')
        .sortBy(child => child.get('position'))
        .reverse();

      return (
        <TisoDetailsView
          tisoReservations={this.tisoReservations(tisoLocation)}
          tisoContainers={this.tisoContainers(tisoLocation)}
          tisoLocation={tisoLocation}
          tisoColumnLocations={tisoColumnLocations}
          showContainer={this.props.showContainer}
          navigateLocation={this.props.navigateLocation}
          selectedContainer={this.props.selectedContainer}
        />
      );
    } else {
      return (
        <div className="empty">No tiso columns exist in this tiso yet</div>
      );
    }
  }
}

class TisoDetailsView extends React.Component {

  static get propTypes() {
    return {
      tisoLocation: PropTypes.instanceOf(Immutable.Map).isRequired,
      tisoColumnLocations: PropTypes.instanceOf(Immutable.List).isRequired,
      tisoReservations: PropTypes.instanceOf(Immutable.Iterable),
      tisoContainers: PropTypes.instanceOf(Immutable.Iterable),
      showContainer: PropTypes.func.isRequired,
      navigateLocation: PropTypes.func.isRequired,
      selectedContainer: PropTypes.instanceOf(Immutable.Map)
    };
  }

  tisoColumnsReservationsMap(tiso, reservations) {
    let tisoReservationsMap = Immutable.Map();

    reservations.forEach((res) => {
      const col = res.getIn(['slot', 'col']);
      const row = res.getIn(['slot', 'row']);
      tisoReservationsMap = tisoReservationsMap.setIn([col, row], res);
    });

    return tisoReservationsMap;
  }

  tisoColumnsContainersMap(tiso, containers) {
    let tisoContainersMap = Immutable.Map();

    containers.forEach((c) => {
      const [col, row] = Array.from(this.containerColRow(tiso, c));
      tisoContainersMap = tisoContainersMap.setIn([col, row], c);
    });

    return tisoContainersMap;
  }

  containerColRow(tiso, container) {
    const tc = this.tisoColumnForContainer(tiso, container);
    return [tc.get('position'), container.getIn(['slot', 'row'])];
  }

  tisoColumnForContainer(tiso, container) {
    return tiso
      .get('children')
      .find(tc => tc.get('id') === container.get('location_id'));
  }

  maxTisoColumnCapacity() {
    const maxCapacityTisoColumn = this.props.tisoColumnLocations.maxBy(tc =>
      tc.getIn(['location_type', 'capacity'])
    );
    return maxCapacityTisoColumn.getIn(['location_type', 'capacity']);
  }

  render() {
    const { tisoLocation } = this.props;
    const { tisoColumnLocations } = this.props;
    const tisoColumnsReservationsMap = this.tisoColumnsReservationsMap(
      tisoLocation,
      this.props.tisoReservations
    );
    const tisoColumnsContainersMap = this.tisoColumnsContainersMap(
      tisoLocation,
      this.props.tisoContainers
    );
    return (
      <Section title="Tiso Details">
        <div className="tiso-details">
          <div className="tiso-heading col-sm-1">
            <div>shaking</div>
            <div>capacity</div>
            <div>column</div>
          </div>
          <div className="col-sm-11">
            {tisoColumnLocations.map((tisoColumn) => {
              const tisoColumnPositon = tisoColumn.get('position');
              return (
                <TisoColumn
                  key={tisoColumn.get('id')}
                  tisoColumn={tisoColumn}
                  tisoColumnReservations={tisoColumnsReservationsMap.get(
                    tisoColumnPositon
                  )}
                  tisoColumnContainers={tisoColumnsContainersMap.get(
                    tisoColumnPositon
                  )}
                  showContainer={this.props.showContainer}
                  navigateLocation={this.props.navigateLocation}
                  selectedContainer={this.props.selectedContainer}
                />
              );
            })}
          </div>
          <div className="tiso-footer">{`Tiso Temperature: ${tisoLocation.getIn(
            ['merged_properties', 'environment']
          )}`}
          </div>
        </div>
      </Section>
    );
  }
}

class TisoColumn extends React.Component {

  static get propTypes() {
    return {
      tisoColumn:             PropTypes.instanceOf(Immutable.Map).isRequired,
      tisoColumnReservations: PropTypes.instanceOf(Immutable.Map),
      tisoColumnContainers:   PropTypes.instanceOf(Immutable.Map),
      showContainer:          PropTypes.func.isRequired,
      navigateLocation:       PropTypes.func.isRequired,
      selectedContainer:      PropTypes.instanceOf(Immutable.Map)
    };
  }

  tisoColumnMaxCapacity() {
    return this.props.tisoColumn.getIn(['location_type', 'capacity']);
  }

  tisoColumnUsedCapacity() {
    let usedSlots = 0;
    for (let position = 0; position < this.tisoColumnMaxCapacity(); position += 1) {
      const { tisoColumnReservations, tisoColumnContainers } = this.props;

      const reservation = tisoColumnReservations ? tisoColumnReservations.get(position) : undefined;
      const container   = tisoColumnContainers ? tisoColumnContainers.get(position) : undefined;

      if (reservation || container) {
        usedSlots += 1;
      }
    }
    return usedSlots;
  }

  tisoPositionHeight() {
    const columnHeight = 250;
    return columnHeight / this.tisoColumnMaxCapacity();
  }

  renderShaking() {
    if (this.props.tisoColumn.getIn(['merged_properties', 'shaking']) === 'true') {
      return <div>shaking</div>;
    } else {
      return (
        <div>
          {' - '}
        </div>
      );
    }
  }

  renderColumnNames() {
    return (
      <a onClick={() => this.props.navigateLocation(this.props.tisoColumn.get('id'))}>
        {this.props.tisoColumn.get('name')}
      </a>
    );
  }

  renderTisoPositions() {
    return Array.from(_.range(0, this.tisoColumnMaxCapacity()).reverse()).map(position =>
      (
        <TisoPosition
          key={position}
          position={position}
          container={
            this.props.tisoColumnContainers
              ? this.props.tisoColumnContainers.get(position)
              : undefined
          }
          reservation={
            this.props.tisoColumnReservations
              ? this.props.tisoColumnReservations.get(position)
              : undefined
          }
          showContainer={this.props.showContainer}
          tisoColumnId={this.props.tisoColumn.get('id')}
          selectedContainer={this.props.selectedContainer}
          height={this.tisoPositionHeight()}
        />
      )
    );
  }

  renderRemainingCapacity() {
    const maxCapacity       = this.tisoColumnMaxCapacity();
    const usedCapacity      = this.tisoColumnUsedCapacity();
    const remainingCapacity = maxCapacity - usedCapacity;

    return <div>{`${remainingCapacity} / ${maxCapacity}`}</div>;
  }

  render() {
    const { tisoColumn } = this.props;

    return (
      <div className="tiso-column col-sm-2" key={tisoColumn.get('id')}>
        {this.renderShaking()}
        {this.renderRemainingCapacity()}
        {this.renderColumnNames()}
        {this.renderTisoPositions()}
      </div>
    );
  }
}

class TisoPosition extends React.Component {

  static get propTypes() {
    return {
      container: PropTypes.instanceOf(Immutable.Map),
      reservation: PropTypes.instanceOf(Immutable.Map),
      showContainer: PropTypes.func.isRequired,
      tisoColumnId: PropTypes.string.isRequired,
      selectedContainer: PropTypes.instanceOf(Immutable.Map),
      height: PropTypes.number.isRequired,
      position: PropTypes.number.isRequired
    };
  }

  renderTisoPosition() {
    const container = this.props.container
      ? this.props.container.toJS()
      : undefined;
    const reservation = this.props.reservation
      ? this.props.reservation.toJS()
      : undefined;
    const { tisoColumnId } = this.props;
    return [
      <div className="tiso-tags" key="tiso-tags">
        <If condition={container}>
          <TisoTag
            container={container}
            showContainer={() =>
              this.props.showContainer(container.id, tisoColumnId)}
            tagText="C"
            selectedContainer={this.props.selectedContainer}
          />
        </If>
        <If condition={reservation}>
          <TisoTag reservation={reservation} tagText="R" />
        </If>
      </div>,
      <div className="tiso-position-index" key="tiso-index">
        {this.props.position}
      </div>
    ];
  }

  render() {
    return (
      <div
        className="tiso-position"
        style={{
          height: this.props.height
        }}
      >
        {this.renderTisoPosition()}
      </div>
    );
  }
}

class TisoTag extends React.Component {

  static get propTypes() {
    return {
      container: PropTypes.object,
      reservation: PropTypes.object,
      showContainer: PropTypes.func,
      selectedContainer: PropTypes.instanceOf(Immutable.Map),
      tagText: PropTypes.string.isRequired
    };
  }

  componentDidMount() {
    this.enablePopover();
  }

  popoverTitle() {
    if (this.props.container) {
      return 'Container Details';
    }
    if (this.props.reservation) {
      return 'Reservation Details';
    }

    return undefined;
  }

  popoverContent() {
    const { container } = this.props;
    const { reservation } = this.props;

    let popoverContent;
    if (container) {
      popoverContent = this.containerDetails(container);
    } else if (reservation) {
      popoverContent = this.reservationDetails(reservation);
    }

    return ReactDOMServer.renderToString(popoverContent);
  }

  containerDetails(container) {
    return (
      <div>
        <dt>id</dt>
        <dd>
          {container.id}
        </dd>
        <dt>label</dt>
        <dd>
          {container.label}
        </dd>
        <dt>type</dt>
        <dd>
          {container.container_type.name}
        </dd>
      </div>
    );
  }

  reservationDetails(reservation) {
    return (
      <div>
        <dt>run id</dt>
        <dd>
          {reservation.run_id}
        </dd>
        <dt>container id</dt>
        <dd>
          {reservation.container_id}
        </dd>
      </div>
    );
  }

  enablePopover() {
    $(this.node).popover({
      placement: 'top',
      trigger: 'hover',
      title: this.popoverTitle(),
      html: true,
      content: this.popoverContent(),
      // Popover was not showing on top due to relative parent, container body to fix
      container: 'body'
    });
  }

  handleTagClick() {
    if (this.props.container) {
      this.props.showContainer();
    }
  }

  render() {
    const id = this.props.selectedContainer
      ? this.props.selectedContainer.get('id')
      : undefined;
    const selectedId = this.props.selectedContainer
      ? this.props.selectedContainer.get('id')
      : undefined;

    return (
      <span
        ref={(node) => {
          this.node = node;
        }}
        className={Classnames({
          'tiso-container': this.props.container,
          'tiso-container-selected': id === selectedId,
          'tiso-reservation': this.props.reservation,
          'tiso-tag': true
        })}
        onClick={() => this.handleTagClick()}
      >
        {this.props.tagText}
      </span>
    );
  }
}

export default TisoDetails;
