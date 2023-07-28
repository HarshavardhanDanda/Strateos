import Immutable from 'immutable';
import _ from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';

import ConnectToStores from 'main/containers/ConnectToStoresHOC';
import Dispatcher from 'main/dispatcher';
import rootNode from 'main/state/rootNode';
import LocationBlacklistForm from 'main/components/LocationBlacklistForm';

import {
  Button,
  ButtonGroup,
  PropertiesList,
  Section,
  Breadcrumbs,
  InplaceInput,
  Spinner
} from '@transcriptic/amino';

import { readableHazards } from 'main/util/Hazards';

import ContainerTypeActions from 'main/actions/ContainerTypeActions';
import ContainerActions from 'main/actions/ContainerActions';
import LocationActions from 'main/actions/LocationActions';
import LocationTypeActions from 'main/actions/LocationTypeActions';
import { LocationAssignmentModal } from 'main/models/LocationSelectorModal/LocationSelectorModal';
import SplitStockModal from 'main/inventory/SplitStockModal';
import TisoDetails from 'main/inventory/TisoDetails';
import Box from 'main/components/Box';
import AddLocationModal from 'main/inventory/locations/AddLocationModal';
import LocationContainerDetails from 'main/inventory/locations/LocationContainerDetails';
import ModalActions from 'main/actions/ModalActions';
import ContainersList from 'main/inventory/locations/ContainersList';
import LocationsList from 'main/inventory/locations/LocationsList';
import PathActions from 'main/inventory/locations/PathActions';
import ContainerSearch from 'main/inventory/locations/search/ContainerSearch';
import LocationUtil from 'main/util/LocationUtil';
import Urls from 'main/util/urls';
import { EditInPlace } from 'main/components/EditInPlace';
import { Loading } from 'main/components/page';
import { CustomPropertySet } from 'main/components/properties';
import ContainerTypeHelper from 'main/helpers/ContainerType';
import ContainerStore from 'main/stores/ContainerStore';
import LocationStore from 'main/stores/LocationStore';
import FeatureConstants from '@strateos/features';
import FeatureStore from 'main/stores/FeatureStore';
import * as ContainerUtil from 'main/util/ContainerUtil';

const LocationExplorerStore = {
  shouldShowLocationDetails: rootNode.sub(
    ['locationExplorer', 'shouldShowLocationDetails'],
    false
  ),

  shouldShowSearcher: rootNode.sub(
    ['locationExplorer', 'shouldShowSearcher'],
    false
  ),

  set({ locationId, containerId, navigate }) {
    this.locationId = locationId;
    this.containerId = containerId;
    this.navigate = navigate;
  },

  currentLocationId() {
    const container = this.currentContainer();

    if (container) {
      return container.get('location_id');
    } else {
      return this.locationId;
    }
  },

  currentLocation() {
    return LocationStore.location(this.currentLocationId());
  },

  currentContainer() {
    if (this.containerId) {
      return ContainerStore.getById(this.containerId);
    }

    return undefined;
  },

  transitionTo(locationId, containerId) {
    return this.navigate({
      locationId,
      containerId
    });
  },

  _selectLocation(locationId) {
    // we need to use null instead of undefined because through much indirection the fetched
    // root node location will be stored with a null id.
    return this.transitionTo(locationId, null); // eslint-disable-line no-null/no-null
  },

  act(action) {
    switch (action.type) {
      case 'PATH_NAVIGATE':
        this._selectLocation(action.id);
        break;

      case 'PATH_SELECT_CONTAINER':
        this.transitionTo(action.locationId, action.containerId);
        break;

      case 'PATH_TOGGLE_LOCATION_DETAILS':
        this.shouldShowLocationDetails.update(v => !v);
        break;

      case 'PATH_SHOW_SEARCHER':
        this.shouldShowSearcher.set(action.value);
        break;

      case 'LOCATION_CREATED':
        this._selectLocation(action.location.id);
        break;

      case 'LOCATION_DESTROYED':
        if (action.id === this.currentLocationId()) {
          this._selectLocation(action.location.get('parent_id'));
        }
        break;

      default:
        break;
    }
  }
};

// Register stores
Dispatcher.register(LocationExplorerStore.act.bind(LocationExplorerStore));

// ################

export class LocationExplorer extends React.Component {
  // enclosingLocation and location are the locations that we will render.
  // For example a box can enclose a cell.  For locations that do not render a group of child
  // locations, enclosingLocation will be equal to location.
  static get propTypes() {
    return {
      location: PropTypes.instanceOf(Immutable.Map).isRequired,
      enclosingLocation: PropTypes.instanceOf(Immutable.Map).isRequired,
      subLocations: PropTypes.instanceOf(Immutable.List),
      containers: PropTypes.instanceOf(Immutable.Seq).isRequired,
      containersByPosition: PropTypes.func.isRequired,
      boxTypeHelper: PropTypes.func.isRequired,
      currentContainer: PropTypes.instanceOf(Immutable.Map),
      currentBoxPosition: PropTypes.number,
      shouldShowLocationDetails: PropTypes.bool.isRequired,
      shouldShowSearcher: PropTypes.bool.isRequired
    };
  }

  constructor(props, context) {
    super(props, context);

    this.onBoxPositionClick = this.onBoxPositionClick.bind(this);
  }

  // eslint-disable-next-line
  isRoot() {
    return this.props.enclosingLocation.get('id') == undefined;
  }

  // TODO This code is repeated in LocationSelectorModal
  onBoxPositionClick(container, position) {
    const box = this.props.enclosingLocation;
    const boxId = box.get('id');
    const boxType = this.props.boxTypeHelper(box);
    const [col, row] = Array.from(boxType.coordinatesFromRobot(position));

    const cell = LocationStore.find(
      location =>
        location.get('parent_id') === boxId &&
        location.get('col') === col &&
        location.get('row') === row
    );

    if (container) {
      PathActions.showContainer(container.get('id'), cell.get('id'));
    } else {
      PathActions.navigate(cell.get('id'));
    }
  }

  breadcrumbs() {
    const location = this.props.enclosingLocation;
    const name = location.get('name');

    return (
      <Breadcrumbs invert={false}>
        <If condition={!this.isRoot()}>
          <a className="breadcrumbs__item-link" onClick={() => PathActions.navigateRoot()}>Root</a>
        </If>
        <If condition={location.get('ancestors')}>
          {location.get('ancestors').map((p) => {
            return (
              <a
                key={p.get('id')}
                className="breadcrumbs__item-link"
                onClick={() =>  {
                  PathActions.navigate(p.get('id'));
                }}
              >
                {p.get('name')}
              </a>
            );
          })}
        </If>
        <If condition={location.get('id') != undefined}>
          <div>
            <EditInPlace
              value={_.isEmpty(name) ? '(No Name)' : name}
              onSave={(val, done) => {
                LocationActions.updateLocation(location.get('id'), {
                  name: val
                }).always(() => done());
              }}
            />
          </div>
        </If>
      </Breadcrumbs>
    );
  }

  locationDetails() {
    const location = this.props.enclosingLocation;

    return (
      <If condition={location.get('id') != undefined}>
        {this.locationDetailsToggle()}
        <If condition={this.props.shouldShowLocationDetails}>
          <LocationDetails location={location} />
        </If>
      </If>
    );
  }

  locationDetailsToggle() {
    return (
      <div>
        <a onClick={() => PathActions.toggleLocationDetails()}>
          <Choose>
            <When condition={this.props.shouldShowLocationDetails}>
              <span>Collapse Details</span>
            </When>
            <Otherwise>
              <span>Show Details</span>
            </Otherwise>
          </Choose>
        </a>
      </div>
    );
  }

  containerActionHandler({ text, action, param }) {
    const container = this.props.currentContainer;
    const label = container.get('label') || container.get('id');

    if (confirm(`${text} ${label}`)) {
      action(container.get('id'), param);
    }
  }

  canAddSubLocations() {
    const category = this.props.enclosingLocation.getIn([
      'location_type',
      'category'
    ]);

    return LocationUtil.addableChildCategories(category).count() > 0;
  }

  renderContainers() {
    const containers = this.props.containers.sortBy(c => c.get('id'));
    return (
      <div>
        <Choose>
          <When condition={containers == undefined}>
            <Loading />
          </When>
          <Otherwise>
            <ContainersList containers={containers} />
          </Otherwise>
        </Choose>
      </div>
    );
  }

  renderContainerDetail() {
    const organization = this.props.currentContainer.get('organization');
    const containerType = this.props.currentContainer.get('container_type');
    const aliquots = this.props.currentContainer.get('aliquots');
    const isTube = containerType && containerType.get('is_tube');
    const containerLabId = this.props.currentContainer && this.props.currentContainer.getIn(['lab', 'id']);

    return (
      <Section title="Container Detail">
        <SplitStockModal sourceContainer={this.props.currentContainer} />
        <If
          condition={ContainerUtil.isPhysicallyAvailable(
            this.props.currentContainer
          )}
        >
          <div className="admin-container-actions">
            <ButtonGroup>
              <If condition={FeatureStore.hasFeatureInLab(FeatureConstants.MANAGE_CONTAINERS_IN_LAB, containerLabId)}>
                <Button
                  type="primary"
                  size="small"
                  onClick={() => {
                    ModalActions.open(
                      `${LocationAssignmentModal.MODAL_ID}${this.props.currentContainer.get(
                        'id'
                      )}`
                    );
                  }}
                >
                  Relocate
                </Button>
              </If>

              <If
                condition={
                  organization == undefined &&
                  aliquots &&
                  isTube &&
                  aliquots.size === 1 &&
                  FeatureStore.hasFeatureInLab(FeatureConstants.MANAGE_CONTAINERS_IN_LAB, containerLabId)
                }
              >
                <Button
                  type="default"
                  size="small"
                  onClick={() => ModalActions.open(SplitStockModal.MODAL_ID)}
                >
                  Split Stock
                </Button>
              </If>

              <If condition={FeatureStore.hasFeatureInLab(FeatureConstants.DESTROY_CONTAINER_RESET_ALL_ALIQUOTS, containerLabId)}>
                <If condition={_.includes(['inbound', 'available', 'consumable'],  this.props.currentContainer.get('status'))}>
                  <Button
                    type="danger"
                    size="small"
                    onClick={() => {
                      this.containerActionHandler({
                        text: 'Delete container',
                        action: ContainerActions.requestDestroyContainer,
                        param: false
                      }); // Does not purge store after delete action
                    }}
                  >
                    Destroy
                  </Button>
                </If>
                <Choose>
                  <When
                    condition={
                      this.props.currentContainer.get('status') === 'pending_destroy'}
                  >
                    <Button
                      type="warning"
                      size="small"
                      onClick={() => {
                        this.containerActionHandler({
                          text: 'Cancel destruction request for',
                          action: ContainerActions.restore
                        });
                      }}
                    >
                      Cancel Destruction Request
                    </Button>
                    <Button
                      type="danger"
                      size="small"
                      onClick={() => {
                        this.containerActionHandler({
                          text: 'Confirm destruction of',
                          action: ContainerActions.destroyContainer,
                          param: false
                        }); // Does not purge store after delete action

                        PathActions.navigate(this.props.location.get('id'));
                      }}
                    >
                      Confirm Destruction
                    </Button>
                  </When>
                </Choose>
              </If>
              <LocationAssignmentModal
                container={this.props.currentContainer}
                initialLocationId={this.props.currentContainer.get(
                  'location_id'
                )}
                onLocationSelected={(locationId) => {
                  const containerId = this.props.currentContainer.get('id');

                  ContainerActions.relocate(containerId, locationId)
                    .then(() => { PathActions.navigate(locationId); });
                }}
                labIdForFilter={this.props.currentContainer.getIn(['lab', 'id'])}
              />
            </ButtonGroup>
          </div>
        </If>

        <LocationContainerDetails container={this.props.currentContainer} />
      </Section>
    );
  }

  // TODO This is very similar to a method in LocationSelectorModal
  renderLocationDetails() {
    const location = this.props.location.toJS();
    const enclosingLocation = this.props.enclosingLocation.toJS();

    const locationCategory =
      location.location_type != undefined
        ? location.location_type.category
        : undefined;

    const enclosingLocationCategory =
      enclosingLocation.location_type != undefined
        ? enclosingLocation.location_type.category
        : undefined;

    if (enclosingLocationCategory === LocationUtil.categories.box) {
      const { numRows, numCols } = LocationStore.boxDimensions(
        enclosingLocation.id
      );

      return (
        <Section title="BoxView">
          <Box
            numRows={numRows}
            numCols={numCols}
            posToContainer={this.props.containersByPosition(
              this.props.enclosingLocation
            )}
            selectedContainer={this.props.currentContainer}
            selectedPosition={this.props.currentBoxPosition}
            onPositionClick={this.onBoxPositionClick}
          />
        </Section>
      );
    } else if (
      locationCategory === 'tiso' ||
      locationCategory === 'tiso_column'
    ) {
      return (
        <div>
          <If condition={FeatureStore.hasFeatureInLab(FeatureConstants.MANAGE_TISOS, location.lab_id)}>
            <TisoDetails
              location={this.props.location}
              showContainer={PathActions.showContainer}
              navigateLocation={PathActions.navigate}
              selectedContainer={this.props.currentContainer}
            />
            <If condition={locationCategory === 'tiso'}>
              {this.renderAddLocation()}
            </If>
          </If>
        </div>
      );
    } else {
      return (
        <div>
          <Section title="Locations" key="locationsSection">
            <div className="locations-section-body">
              <Choose>
                <When condition={this.props.subLocations == undefined}>
                  <Loading />
                </When>
                <Otherwise>
                  <LocationsList locations={this.props.subLocations} />
                </Otherwise>
              </Choose>
              <If condition={FeatureStore.hasFeature(FeatureConstants.MANAGE_CONTAINER_LOCATIONS) && this.canAddSubLocations()}>
                {this.renderAddLocation()}
              </If>
            </div>
          </Section>
          <If condition={!this.isRoot() && FeatureStore.hasFeature(FeatureConstants.MANAGE_CONTAINERS_IN_LAB)}>
            <Section title="Containers" key="containersSection">
              {this.renderContainers()}
            </Section>
          </If>
        </div>
      );
    }
  }

  renderAddLocation() {
    return (
      <div className="add-location-button">
        <AddLocationModal parentLocation={this.props.enclosingLocation} />
        <Button
          type="default"
          icon="fa fa-plus"
          onClick={() => { ModalActions.open(AddLocationModal.MODAL_ID); }}
        >
          Add Location
        </Button>
      </div>
    );
  }

  render() {
    return (
      <div className="location-explorer">
        {this.breadcrumbs()}
        {this.locationDetails()}
        <div className="row">
          <div className="col-sm-6">
            <If condition={FeatureStore.hasFeature(FeatureConstants.MANAGE_CONTAINERS_IN_LAB)}>
              <Section title="Container Search">
                <ContainerSearch
                  shouldShowSearcher={this.props.shouldShowSearcher}
                />
              </Section>
            </If>
            {this.renderLocationDetails()}
          </div>
          <If condition={this.props.currentContainer != undefined}>
            <div className="col-sm-6">
              {this.renderContainerDetail()}
            </div>
          </If>
        </div>
      </div>
    );
  }
}

class LocationDetails extends React.Component {
  static get propTypes() {
    return {
      location: PropTypes.instanceOf(Immutable.Map).isRequired
    };
  }

  constructor(props, context) {
    super(props, context);

    this.state = {
      formValue: []
    };

    this.destroy = this.destroy.bind(this);
    this.relocate = this.relocate.bind(this);
  }

  destroy() {
    const text = `Are you sure you want to delete location ${this.props.location.get(
      'id'
    )}?
      This will delete this location and all sub locations within this location.`;

    if (confirm(text)) {
      LocationActions.destroyLocation(this.props.location.get('id'));
    }
  }

  relocate(locationId) {
    const text = `Are you sure you want to relocate location ${this.props.location.get(
      'id'
    )}?`;

    if (confirm(text)) {
      LocationActions.relocateLocation(
        this.props.location.get('id'),
        locationId
      );
    }
  }

  updateLocationType(ltype) {
    const id = this.props.location.get('id');
    const ltype_id = ltype ? ltype.get('id') : undefined;

    LocationActions.updateLocation(id, {
      location_type_id: ltype_id
    });
  }

  renderHazards() {
    const location = this.props.location;
    const formValue = this.state.formValue;

    const blacklist = location.get('blacklist', Immutable.List([])).toJS();
    const ancestorBlacklist = location.get('ancestor_blacklist', Immutable.List([])).toJS();

    return (
      <InplaceInput
        disabled={!FeatureStore.hasFeature(FeatureConstants.MANAGE_CONTAINER_LOCATIONS)}
        onSave={() => {
          const id = location.get('id');
          const data = { blacklist: formValue };
          return LocationActions.updateLocation(id, data, false);
        }}
        onEdit={() => {
          this.setState({ formValue: blacklist });
        }}
        onCancel={() => {
          return Promise.resolve(
            this.setState({ formValue: [] })
          );
        }}
        content={{
          id: 'blacklisted-hazards',
          viewComponent: <p>{readableHazards([...ancestorBlacklist, ...blacklist])}</p>,
          editComponent: (
            <LocationBlacklistForm
              blacklist={blacklist}
              ancestorBlacklist={ancestorBlacklist}
              onChange={newBlacklist => this.setState({ formValue: newBlacklist })}
            />
          )
        }}
        expandOnEdit={false}
      />
    );
  }

  // Displays editable location_type and location property set.
  render() {
    const { location } = this.props;
    const capacity = location.getIn(['location_type', 'capacity']);
    const position = location.get('position');
    const parseLocationVal = v => ((!v && v != 0) ? '-' : v);

    return (
      <div className="row">
        <div className="col-sm-6">
          <Section title="Location Details">
            <PropertiesList
              properties={Immutable.Map({
                ID: location.get('id'),
                'Location Type': location.getIn(['location_type', 'category']),
                Capacity: parseLocationVal(capacity)
              })}
            />
            <div className="tx-stack__block--md">
              <dt>Position</dt>
              <EditInPlace
                value={parseLocationVal(position)}
                onSave={(val, done) => {
                  const newPosition = _.isEmpty(val) ? undefined : val;
                  LocationActions.updateLocation(location.get('id'), {
                    newPosition
                  }).always(() => done());
                }}
              />
            </div>
            <div className="tx-stack__block--md">
              <dt>Blacklisted hazards</dt>
              <dd>{this.renderHazards()}</dd>
            </div>
            <div className="tx-stack__block--md">
              <dt>Properties</dt>
              <LocationPropertySet location={location} />
            </div>
            <If condition={FeatureStore.hasFeature(FeatureConstants.MANAGE_CONTAINER_LOCATIONS)}>
              <ButtonGroup>
                <Button
                  type="primary"
                  size="medium"
                  onClick={() => ModalActions.open('MODAL_RelocateLocation')}
                >
                  Relocate Location
                </Button>
                <Button type="danger" size="medium" onClick={this.destroy}>
                  Delete Location
                </Button>
              </ButtonGroup>
              <LocationAssignmentModal
                modalId={'MODAL_RelocateLocation'}
                labIdForFilter={location.get('lab_id')}
                disableDetails
                initialLocationId={location.get('id')}
                onLocationSelected={(locationId) => {
                  PathActions.navigate(this.props.location.get('id'));
                  this.relocate(locationId);
                }}
              />
            </If>
          </Section>
        </div>
      </div>
    );
  }
}

class LocationPropertySet extends React.Component {
  static get propTypes() {
    return {
      location: PropTypes.instanceOf(Immutable.Map).isRequired
    };
  }

  render() {
    const location = this.props.location.toJS();
    const parent_properties = _.omitBy(
      location.merged_properties,
      (_v, k) => k in location.properties
    );

    return (
      <dl className="dl-horizontal metadata-properties">
        {_.map(parent_properties, (v, k) => {
          return (
            <div
              className="property"
              style={{
                color: 'grey'
              }}
            >
              <dt>
                {k}
              </dt>
              <dd>
                {v}
              </dd>
            </div>
          );
        })}
        <CustomPropertySet
          editable={FeatureStore.hasFeature(FeatureConstants.MANAGE_CONTAINER_LOCATIONS)}
          properties={location.properties}
          onChangeProperty={({ key, value }) => {
            let props = this.props.location.get('properties');

            props = props.set(key, value);

            LocationActions.updateLocation(this.props.location.get('id'), {
              properties: props.toJS()
            });
          }}
          onAddProperty={({ key, value }) => {
            const props = this.props.location.get('properties').set(key, value);

            LocationActions.updateLocation(this.props.location.get('id'), {
              properties: props.toJS()
            });
          }}
          onRemoveProperty={(key) => {
            const props = this.props.location.get('properties').remove(key);

            LocationActions.updateLocation(this.props.location.get('id'), {
              properties: props.toJS()
            });
          }}
        />
      </dl>
    );
  }
}

// TODO: Split this up into two views: LocationPane and ContainerPane
//       It is confusing that params.locationId or params.containerId
//       can be valid (but not both at the same time).  Two components
//       that handle each case would be more clear.
class LocationsPane extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.boxTypeHelper = this.boxTypeHelper.bind(this);
    this.containersByBoxPosition = this.containersByBoxPosition.bind(this);
    this.navigateToLocation = this.navigateToLocation.bind(this);
  }

  componentWillMount() {
    return this.init(this.props);
  }

  componentDidUpdate(prevProps) {
    if (!_.isEqual(this.props.match.params, prevProps.match.params)) {
      this.init(this.props);
    }
  }

  getLocationsLink() {
    // link goes to previous location/container if available
    if (this.state.lastContainerId) {
      return Urls.container(this.state.lastContainerId);
    } else if (this.state.lastLocationId) {
      return Urls.location(this.state.lastLocationId);
    } else {
      return Urls.locations();
    }
  }

  navigateToLocation({ locationId, containerId }) {
    this.setState(
      {
        lastLocationId: locationId,
        lastContainerId: containerId
      },
      () => {
        let target;

        if (containerId) {
          target = Urls.container_location(containerId);
        } else if (locationId) {
          target = Urls.location(locationId);
        } else {
          target = Urls.locations();
        }

        this.props.history.push(target);
      }
    );
  }

  setExplorerStore(props) {
    LocationExplorerStore.set({
      locationId: props.match.params.locationId || null, // eslint-disable-line no-null/no-null
      containerId: props.match.params.containerId || null, // eslint-disable-line no-null/no-null
      navigate: this.navigateToLocation
    });
  }

  init(props) {
    this.setExplorerStore(props);
    LocationTypeActions.loadAll();
    ContainerTypeActions.loadAll();

    this.setState({
      lastLocationId: this.props.match.params.locationId || null, // eslint-disable-line no-null/no-null
      lastContainerId: this.props.match.params.containerId || null // eslint-disable-line no-null/no-null
    });

    // Load the current location, which might be undefined and which will load the root
    // location as the views depend on some location existing.
    // TODO: this needs to be reworked.
    this.loadLocation(props.match.params.locationId);

    if (props.match.params.containerId) {
      this.loadContainer(props.match.params.containerId);
    }
  }

  isContainerPage() {
    return this.props.match.params.containerId != undefined;
  }

  loadContainer(containerId) {
    ContainerActions.load(containerId).done(container =>
      this.loadLocation(container.location_id)
    );

    ContainerActions.getContainerLocationErrors(containerId);
  }

  loadLocation(locationId) {
    const options = {
      include: 'containers,children',
      'fields[containers]': 'id,status,barcode,label,container_type_shortname,container_type_id,location_id,organization_id,is_tube'
    };
    const locationRequest =  locationId !== undefined ? LocationActions.loadLocation(locationId, options) : LocationActions.root();
    locationRequest.done((response) => {
      const location = locationId !== undefined ? { id: response.data.id,  ...response.data.attributes } : response;
      const category =
        location.location_type != undefined
          ? location.location_type.category
          : undefined;

      switch (category) {
        case LocationUtil.categories.box:
          LocationActions.loadDeep(location.id);
          LocationActions.loadDeepContainers(location.id);
          break;
        case LocationUtil.categories.box_cell:
          this.loadLocation(location.parent_id);
          break;
        default:
          break;
      }
    });
  }

  // TODO This code is repeated in LocationSelectorModal
  boxTypeHelper(location) {
    const { numCols } = LocationStore.boxDimensions(location.get('id'));

    return new ContainerTypeHelper({
      col_count: numCols
    });
  }

  // TODO This code is repeated in LocationSelectorModal
  containersByBoxPosition(boxLocation) {
    const boxTypeHelper = this.boxTypeHelper(boxLocation);
    let containersByPos = Immutable.Map();

    this.allContainersInView().forEach((container) => {
      const cell = LocationStore.getById(container.get('location_id'));
      const cellRow = cell.get('row');
      const cellCol = cell.get('col');
      const robotWell = boxTypeHelper.robotFromCoordinates({
        x: cellCol,
        y: cellRow
      });
      containersByPos = containersByPos.set(robotWell, container);
    });

    return containersByPos;
  }

  // TODO This is repeated in LocationSelectorModal
  allContainersInView() {
    const enclosingLocation = LocationStore.getById(this.enclosingLocationId());
    let locationIds = [enclosingLocation.get('id')];

    if (
      enclosingLocation.getIn(['location_type', 'category']) ===
      LocationUtil.categories.box
    ) {
      locationIds = enclosingLocation
        .get('children', Immutable.List())
        .map(child => child.get('id'))
        .concat(locationIds)
        .toJS();
    }

    return ContainerStore.containersAt(...(locationIds || []));
  }

  // TODO This is repeated in LocationSelectorModal
  enclosingLocationId() {
    const currentLocation = LocationExplorerStore.currentLocation();

    if (LocationStore.isBoxCell(currentLocation)) {
      return currentLocation.get('parent_id');
    } else {
      return LocationExplorerStore.currentLocationId();
    }
  }

  // TODO This is repeated in LocationSelectorModal
  currentBoxPosition() {
    const location = LocationExplorerStore.currentLocation();

    if (LocationStore.isBoxCell(location)) {
      const box = LocationStore.getById(location.get('parent_id'));
      return this.boxTypeHelper(box).robotFromCoordinates({
        x: location.get('col'),
        y: location.get('row')
      });
    } else {
      return undefined;
    }
  }

  // TODO This is repeated in LocationSelectorModal
  loading() {
    const enclosingLocation = LocationStore.getById(this.enclosingLocationId());
    const currentContainer = LocationExplorerStore.currentContainer();

    if (this.isContainerPage()) {
      return currentContainer == undefined || enclosingLocation == undefined;
    } else if (enclosingLocation == undefined) {
      return true;
    } else if (
      enclosingLocation.getIn(['location_type', 'category']) ===
      LocationUtil.categories.box
    ) {
      return !LocationStore.isBoxLoaded(enclosingLocation.get('id'));
    } else {
      return false;
    }
  }

  render() {
    const location = LocationExplorerStore.currentLocation();
    const enclosingLocation = LocationStore.getById(this.enclosingLocationId());

    return (
      <Choose>
        <When condition={this.loading()}>
          <Spinner />
        </When>
        <Otherwise>
          <LocationExplorer
            location={location}
            enclosingLocation={enclosingLocation}
            subLocations={LocationStore.childrenOf(
              enclosingLocation.get('id')
            )}
            containers={this.allContainersInView()}
            containersByPosition={this.containersByBoxPosition}
            boxTypeHelper={this.boxTypeHelper}
            currentContainer={LocationExplorerStore.currentContainer()}
            currentBoxPosition={this.currentBoxPosition()}
            shouldShowLocationDetails={LocationExplorerStore.shouldShowLocationDetails.get()}
            shouldShowSearcher={LocationExplorerStore.shouldShowSearcher.get()}
          />
        </Otherwise>
      </Choose>
    );
  }
}

LocationsPane.propTypes = {
  history: PropTypes.object.isRequired,
  match: PropTypes.object.isRequired
};

export default ConnectToStores(LocationsPane, () => {});
