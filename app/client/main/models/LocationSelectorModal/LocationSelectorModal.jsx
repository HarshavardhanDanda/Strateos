import Immutable from 'immutable';
import _         from 'lodash';
import PropTypes from 'prop-types';
import React     from 'react';
import classNames from 'classnames';
import { Banner, Card, LabeledInput, Spinner, TextInput }  from '@transcriptic/amino';
import { TabLayout, TabLayoutSidebar } from 'main/components/TabLayout/TabLayout';

import ContainerTypeActions                from 'main/actions/ContainerTypeActions';
import ModalActions                        from 'main/actions/ModalActions';
import ContainerAPI                    from 'main/api/ContainerAPI';
import Box                                 from 'main/components/Box';
import LocationTree, { LocationTreeLogic } from 'main/components/LocationTree';
import LocationUtil                        from 'main/util/LocationUtil';
import LocationsAPI                        from 'main/api/LocationsAPI';
import { SinglePaneModal }                 from 'main/components/Modal';
import ConnectToStores                     from 'main/containers/ConnectToStoresHOC';
import ContainerTypeHelper                 from 'main/helpers/ContainerType';
import ContainerStore                      from 'main/stores/ContainerStore';
import ContainerTypeStore                  from 'main/stores/ContainerTypeStore';
import LocationStore                       from 'main/stores/LocationStore';
import LocationActions                     from 'main/actions/LocationActions';
import NotificationActions                 from 'main/actions/NotificationActions';
import LocationKey                         from './LocationKey';
import LocationSearch                      from './LocationSearch';

import './LocationSelectorModal.scss';

const LOCATION_OPTIONS = {
  include: 'children'
};

const LOCATION_OPTIONS_WITH_CONTAINERS = {
  include: 'containers,children',
  'fields[containers]': 'id,status,barcode,label,container_type_shortname,container_type_id,location_id,organization_id,is_tube'
};

const SELECTOR_MODAL_ID = 'LOCATION_SELECTOR_MODAL';
const ASSIGNMENT_MODAL_ID = 'LOCATION_ASSIGNMENT_MODAL';

export class LocationSelector extends React.Component {

  static get defaultProps() {
    return {
      prohibitedLocations: Immutable.Set(),
      prohibitedContainers: Immutable.Set(),
      canSelectContainer: false,
      mustSelectContainer: false,
      disableDetails: false,
      onLocationSelected: () => {},
      isAssignment: false
    };
  }

  static get propTypes() {
    return {
      container:               PropTypes.instanceOf(Immutable.Map),
      initialLocationId:       PropTypes.string,
      onLocationSelected:      PropTypes.func.isRequired,
      prohibitedLocations:     PropTypes.instanceOf(Immutable.Set),
      prohibitedContainers:    PropTypes.instanceOf(Immutable.Set),
      canSelectContainer:      PropTypes.bool,
      mustSelectContainer:     PropTypes.bool,
      modalId:                 PropTypes.string,
      disableDetails:          PropTypes.bool,
      onDismissed:             PropTypes.func,
      containersCount:         PropTypes.number,
      updateMultipleLocations: PropTypes.func,
      labIdForFilter:          PropTypes.string,
      isSelectDeep:            PropTypes.bool,
      isAssignment:            PropTypes.bool
    };
  }

  constructor(props, context) {
    super(props, context);

    this.onBoxPositionClick       = this.onBoxPositionClick.bind(this);
    this.onOpen                   = this.onOpen.bind(this);
    this.onSearchLocationSelected = this.onSearchLocationSelected.bind(this);
    this.onSelectButtonClick      = this.onSelectButtonClick.bind(this);
    this.onTreeOpen               = this.onTreeOpen.bind(this);
    this.onTreeSelect             = this.onTreeSelect.bind(this);
    this.hasSelectedLocations     = this.hasSelectedLocations.bind(this);
    this.renderTopArea            = this.renderTopArea.bind(this);

    this.state = this.getInitialState(props);
  }

  getInitialState(props) {
    return {
      nodeState: Immutable.fromJS({
        null: {
          isRoot: true,
          isOpen: true
        }
      }),
      initialLocation: undefined,
      locationId: props.initialLocationId,
      suggestedLocation: undefined,
      loadingLocation: true,
      loadingSuggestion: false,
      allotedLocations: undefined,
      overrideReason: null,
      showOverrideReason: false
    };
  }

  componentDidMount() {
    if (this.state.locationId) {
      this.loadAndFocusLocation(this.state.locationId);
    }
  }

  onOpen() {
    if (this.props.container) {
      // TODO We only need to fetch the container type for this.props.container
      ContainerTypeActions.loadAll();
    }
    this.setState(this.getInitialState(this.props), () => {
      this.fetchLocations(undefined, Immutable.List());
      this.loadInitialLocation();
      this.getSuggestedLocation();
    });
  }

  onTreeOpen(locationId) {
    const isOpen = LocationTreeLogic.isOpen(this.state.nodeState, locationId);

    const nodeState = LocationTreeLogic.setOpen(this.state.nodeState, locationId, !isOpen);

    return this.setState({ nodeState }, () => {
      if (!isOpen) {
        this.fetchLocations(locationId);
      }
    });
  }

  onTreeSelect(locationId) {
    // Root node has no id
    if (!locationId) {
      return;
    }

    const location     = LocationStore.getById(locationId);
    const category     = location.getIn(['location_type', 'category']);
    const cellCategory = LocationUtil.categories.box_cell;

    const locationToSelectInTree = (category === cellCategory) ? location.get('parent_id') : locationId;

    let nodeState = LocationTreeLogic.exclusiveSelect(this.state.nodeState, locationToSelectInTree);
    nodeState     = LocationTreeLogic.setBusy(nodeState, locationToSelectInTree, true);

    const overrideReason = null;
    const showOverrideReason = false;

    this.setState({ nodeState, locationId, overrideReason, showOverrideReason }, () => {
      return this.fetchLocationComplete(locationToSelectInTree);
    });
  }

  onSelectButtonClick() {
    if (this.shouldRequireOverrideReason()) {
      this.requireOverrideReason();
      return Promise.reject();
    } else {
      return this.onSelect();
    }
  }

  onSelect() {
    const hasHazard = this.hasBlackListedHazards();

    if (hasHazard) {
      NotificationActions.createNotification({
        text: 'This location is blacklisted for this container',
        isError: true
      });
    } else {
      if (this.state.suggestedLocation) {
        if (this.isOverridingSuggestion()) {
          ContainerAPI.logOverrideReason(
            this.props.container,
            this.state.overrideReason,
            this.state.suggestedLocation ? this.state.suggestedLocation.id : undefined,
            this.state.locationId
          );
        } else {
          ContainerAPI.logLocationPickSuccess(
            this.props.container,
            this.state.suggestedLocation ? this.state.suggestedLocation.id : undefined
          );
        }
      }

      this.props.onLocationSelected(this.state.locationId);

      if (this.props.updateMultipleLocations) {
        if (this.hasSelectedLocations()) {
          this.props.updateMultipleLocations(this.state.allotedLocations);
        } else { this.props.updateMultipleLocations(this.state.locationId); }
      }

      return this.dismiss();
    }
  }

  hasBlackListedHazards() {
    if (!this.props.container) {
      return false;
    }
    const hazards = this.props.container.get('hazards');
    const location = LocationStore.getById(this.state.locationId);
    const blacklist = location && location.get('blacklist');
    return (blacklist && hazards) && hazards.some(hazard => blacklist.includes(hazard));
  }

  hasSelectedLocations() {
    return _.isArray(this.state.allotedLocations) &&
    this.state.allotedLocations.map((location) => location.get('id')).includes(this.state.locationId);
  }

  onSearchLocationSelected(location) {
    if (location) {
      const locationId = location.get('id');
      this.loadAndFocusLocation(locationId, true);
    }
  }

  // TODO This code is repeated in LocationsPane
  onBoxPositionClick(container, position) {
    const boxId = this.enclosingLocationId();
    const box = LocationStore.getById(boxId);
    const boxType = this.boxTypeHelper(box);
    const [col, row] = Array.from(boxType.coordinatesFromRobot(position));
    const cell = LocationStore.find(
      location =>
        location.get('parent_id') === boxId &&
        location.get('col') === col &&
        location.get('row') === row
    );

    const cid = container ? container.get('id') : undefined;
    const containerAllowed =
      !this.props.prohibitedContainers.contains(cid) &&
      (this.props.canSelectContainer || this.props.mustSelectContainer);

    const locationAllowed = !this.props.mustSelectContainer;
    let nextLocation;

    if (this.props.updateMultipleLocations) {
      nextLocation = LocationStore.nextAvailableLocations(
        cell, this.props.containersCount, []
      );
    }

    if ((container && containerAllowed) || (!container && locationAllowed)) {
      this.setState({
        locationId: cell.get('id'),
        allotedLocations: nextLocation
      });
    }
  }

  getSuggestedLocation() {
    if (!this.props.container) {
      return;
    }

    this.setState({
      loadingSuggestion: true
    });

    LocationsAPI.pickLocationForContainer(this.props.container.get('id')).done(({ location }) => {
      const idToFocus = location ? location.id : undefined || this.state.locationId;

      this.setState({
        suggestedLocation: location,
        loadingSuggestion: false,
        locationId: idToFocus
      }, () => { LocationActions.loadLocation(idToFocus, LOCATION_OPTIONS_WITH_CONTAINERS); });

      if (idToFocus) {
        this.loadAndFocusLocation(idToFocus);
      }
    });
  }

  hasFullyLoadedLocation(locationId) {
    const location     = LocationStore.getById(locationId);

    if (
      (location
        ? location.getIn(['location_type', 'category'])
        : undefined) === LocationUtil.categories.box_cell
    ) {
      // To render a box_cell we need all the data for its parent
      const box = LocationStore.getById(location.get('parent_id'));
      return (
        (box ? box.has('children') : undefined) &&
        (box ? box.has('containers') : undefined)
      );
    } else {
      return location ? location.has('containers') : undefined;
    }
  }

  dismiss() {
    ModalActions.close(this.fullModalId());
  }

  fullModalId() {
    if (this.props.modalId) {
      return this.props.modalId;
    } else {
      const containerId = this.props.container
        ? this.props.container.get('id')
        : '';
      const MODAL_ID = this.props.isAssignment ? ASSIGNMENT_MODAL_ID : SELECTOR_MODAL_ID;
      return `${MODAL_ID}${containerId}`;
    }
  }

  loadInitialLocation() {
    if (this.state.locationId) {
      return LocationActions.loadLocation(
        this.state.locationId
      ).done((location) => {
        return this.setState({
          loadingLocation: false,
          initialLocation: location
        });
      });
    }
  }

  loadAndFocusLocation(locationId, scrollIntoView) {
    if (scrollIntoView) {
      const location = LocationStore.getById(locationId);
      if (location) {
        const parentPath = location.get('parent_path');
        const parentId = parentPath.get(0);
        let { nodeState } = this.state;

        if (parentId) {
          const isDeepLoaded = nodeState.getIn([parentId, 'isDeepLoaded']);
          if (!isDeepLoaded) {
            LocationsAPI.loadDeep(parentId).done(() => {
              parentPath.forEach((id) => {
                nodeState = LocationTreeLogic.setDeepLoaded(nodeState, id, true);
              });
              this.setState({
                nodeState
              }, () => this.focusLocation(locationId));
            });
          }
        }
      }
    }

    if (!this.hasFullyLoadedLocation(locationId)) {
      return LocationActions.loadLocation(locationId).done((response) => {
        const location = locationId !== undefined ? { id: response.data.id,  ...response.data.attributes } : response;

        // TODO This code is repeated in LocationsPane
        this.focusLocation(locationId, scrollIntoView);
        switch (location.location_type
          ? location.location_type.category
          : undefined) {
          case LocationUtil.categories.box:
            if (!this.props.disableDetails) {
              LocationsAPI.loadDeepContainers(location.id);
            }
            break;
          case LocationUtil.categories.box_cell:
            LocationActions.loadLocation(location.parent_id, LOCATION_OPTIONS);
            break;
          default:
            break;
        }
      });
    } else {
      return this.focusLocation(locationId, scrollIntoView);
    }
  }

  focusLocation(locationId, scrollIntoView) {
    const location = LocationStore.getById(locationId);

    const locationToSelectInTree =
      location.getIn(['location_type', 'category']) ===
      LocationUtil.categories.box_cell
        ? location.get('parent_id')
        : locationId;

    // visually select and expand node
    let { nodeState } = this.state;
    nodeState = LocationTreeLogic.exclusiveSelect(
      nodeState,
      locationToSelectInTree
    );
    nodeState = LocationTreeLogic.closeAll(nodeState);
    nodeState = LocationTreeLogic.openPath(
      nodeState,
      locationToSelectInTree,
      this.getAllowedLocations()
    );

    return this.setState({
      nodeState,
      locationId
    }, () => {
      if (scrollIntoView) {
        this.scrollSelectedIntoView();
      }
    });
  }

  fetchLocations(locationId) {
    let nodeState = LocationTreeLogic.setBusy(
      this.state.nodeState,
      locationId,
      true
    );
    this.setState({
      nodeState
    });

    return LocationsAPI.loadDeep(locationId).always(() => {
      if (this.state.locationId) {
        this.loadAndFocusLocation(this.state.locationId);
      }

      nodeState = LocationTreeLogic.setBusy(
        this.state.nodeState,
        locationId,
        false
      );
      nodeState = LocationTreeLogic.setDeepLoaded(
        nodeState,
        locationId,
        true
      );
      return this.setState({
        nodeState
      });
    });
  }

  fetchLocationComplete(locationId) {
    // Load complete location with containers
    let nodeState = LocationTreeLogic.setBusy(
      this.state.nodeState,
      locationId,
      true
    );
    this.setState({
      nodeState
    });

    const location = LocationStore.getById(locationId);

    const promise =
      !this.props.disableDetails && this.isBox(location)
        ? (
          LocationActions.loadLocation(locationId, LOCATION_OPTIONS),
          LocationsAPI.loadDeepContainers(locationId)
        )
        : LocationActions.loadLocation(locationId, LOCATION_OPTIONS);

    return promise.always(() => {
      nodeState = LocationTreeLogic.setBusy(
        this.state.nodeState,
        locationId,
        false
      );
      return this.setState({
        nodeState
      });
    });
  }

  scrollSelectedIntoView() {
    const elements = document.getElementsByClassName('hierarchy-tree__node--selected');
    if (elements.length) {
      elements[0].scrollIntoView({
        behavior: 'auto',
        block: 'center',
        inline: 'center'
      });
    }
  }

  isOverridingSuggestion() {
    return (
      this.state.suggestedLocation &&
      this.state.locationId &&
      this.state.suggestedLocation.id !== this.state.locationId
    );
  }

  isBox(location) {
    return location.getIn(['location_type', 'category']) === LocationUtil.categories.box;
  }

  selectionDisabled() {
    if (this.loading()) {
      return true;
    }
    if (!this.state.locationId) {
      return true;
    }
    if (this.props.prohibitedLocations.includes(this.state.locationId)) {
      return true;
    }

    const selectedLocation = LocationStore.getById(this.state.locationId);
    const selectedContainer = this.getAllowedLocations().find(
      container => container.get('location_id') === this.state.locationId
    );

    if (this.props.mustSelectContainer && !selectedContainer) {
      return true;
    }

    if (this.state.showOverrideReason && !this.state.overrideReason) {
      return true;
    }

    if (this.props.isAssignment && this.isBox(selectedLocation)) {
      // Cannot assign to a tube box. Must select an individual cell.
      return true;
    }

    return false;
  }

  // TODO This is repeated in LocationsPane
  boxTypeHelper(location) {
    const { numCols } = LocationStore.boxDimensions(location.get('id'));
    return new ContainerTypeHelper({
      col_count: numCols
    });
  }

  // TODO This is repeated in LocationsPane
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
      return containersByPos;
    });
    return containersByPos;
  }

  // TODO This is repeated in LocationsPane
  allContainersInView() {
    const location = LocationStore.getById(this.enclosingLocationId());

    // add parent location
    let locationIds = [location.get('id')];

    // add children locations
    if (location.getIn(['location_type', 'category']) === LocationUtil.categories.box) {
      locationIds = location
        .get('children', Immutable.List())
        .map(child => child.get('id'))
        .concat(locationIds)
        .toJS();
    }

    // find containers within these locations
    const containers = ContainerStore.containersAt(...(locationIds || []));

    // fake containers that are prohibited/reserved
    const matchedLocations = Immutable.Set(locationIds).intersect(
      this.props.prohibitedLocations
    );
    const fakeContainers = matchedLocations.map(location_id =>
      Immutable.Map({
        location_id
      })
    );

    return containers.concat(fakeContainers);
  }

  // TODO This is repeated in LocationsPane
  // The enclosing location is the outmost location that we are rendering.
  // If we are viewing a box_cell, then the enclosingLocation is the box that contains that cell.
  enclosingLocationId() {
    const currentLocation = LocationStore.getById(this.state.locationId);
    if (LocationStore.isBoxCell(currentLocation)) {
      return currentLocation.get('parent_id');
    } else {
      return this.state.locationId;
    }
  }

  // TODO This is repeated in LocationsPane
  currentBoxPosition() {
    const cell = LocationStore.getById(this.state.locationId);
    if (
      cell.getIn(['location_type', 'category']) ===
      LocationUtil.categories.box_cell
    ) {
      const box = LocationStore.getById(cell.get('parent_id'));
      if (this.state.allotedLocations) {
        return this.state.allotedLocations.map((location) => {
          return (this.boxTypeHelper(box).robotFromCoordinates({
            x: location.get('col'),
            y: location.get('row')
          }));
        });
      }

      return this.boxTypeHelper(box).robotFromCoordinates({
        x: cell.get('col'),
        y: cell.get('row')
      });
    } else {
      return undefined;
    }
  }

  // TODO This is repeated in LocationsPane
  loading() {
    const enclosingLocation = LocationStore.getById(this.enclosingLocationId());

    if (!enclosingLocation) {
      return true;
    }

    if (
      !this.props.disableDetails && this.isBox(enclosingLocation)
    ) {
      return !LocationStore.isBoxLoaded(enclosingLocation.get('id'));
    } else {
      return false;
    }
  }

  shouldRequireOverrideReason() {
    let containerIsTube = false;
    if (this.props.container) {
      const cType = ContainerTypeStore.getById(
        this.props.container.get('container_type_id')
      );
      containerIsTube = cType && cType.get('is_tube');
    }

    return (!containerIsTube && this.isOverridingSuggestion()) && !this.state.overrideReason;
  }

  requireOverrideReason() {
    this.setState({ showOverrideReason: true });
  }

  getAllowedLocations() {
    return this.props.labIdForFilter ?
      LocationStore.locationsByLabId(this.props.labIdForFilter) :
      LocationStore.getAll();
  }

  renderOverrideReason() {
    return (
      <div className="tx-stack tx-stack--sm">
        <Banner
          bannerType="warning"
          bannerMessage="Please describe why the suggested location is not adequate."
        />
        <LabeledInput label="Feedback">
          <TextInput
            placeholder="Enter reason"
            value={this.state.overrideReason}
            onChange={(event) => {
              this.setState({ overrideReason: event.target.value });
            }}
            autoFocus
          />
        </LabeledInput>
      </div>
    );
  }

  // TODO This is very similar to a method in LocationsPane
  renderLocationDetails() {
    const enclosingLocation = LocationStore.getById(this.enclosingLocationId());

    if (this.loading()) {
      return <Spinner />;
    }

    // Only render details of a location for boxes because they render their
    // children graphically, not in the tree view.
    if (
      enclosingLocation.getIn(['location_type', 'category']) ===
      LocationUtil.categories.box
    ) {
      const { numRows, numCols } = LocationStore.boxDimensions(
        enclosingLocation.get('id')
      );
      return (
        <div className="location-selector-modal__location-box">
          <Box
            numRows={numRows}
            numCols={numCols}
            posToContainer={this.containersByBoxPosition(enclosingLocation)}
            disabledContainerIds={this.props.prohibitedContainers}
            selectedContainer={undefined}
            selectedPosition={this.currentBoxPosition()}
            onPositionClick={this.onBoxPositionClick}
          />
          <h2>
            {enclosingLocation.get('id')}
          </h2>
        </div>
      );
    }

    return undefined;
  }

  renderTopArea() {
    return (
      <div className="tx-stack tx-stack--sm">
        <div className="location-selector-modal__search-section">
          <LocationSearch
            labId={this.props.labIdForFilter}
            onSelect={this.onSearchLocationSelected}
          />
        </div>
        {this.props.container && (
          <LocationKey
            current={this.state.initialLocation}
            suggested={this.state.suggestedLocation}
            selectedId={this.state.locationId}
            loading={this.state.loadingSuggestion}
            onClickId={locationId => this.onTreeSelect(locationId)}
          />
        )}
      </div>
    );
  }

  render() {
    const modalSize = this.props.disableDetails ? 'large' : 'xlg';

    return (
      <SinglePaneModal
        modalId={this.fullModalId()}
        modalSize={modalSize}
        title="Select location"
        modalClass="location-selector-modal"
        onOpen={this.onOpen}
        onDismissed={() => (this.props.onDismissed && this.props.onDismissed())}
        onDismiss={() => this.dismiss()}
        onAccept={this.onSelectButtonClick}
        acceptBtnDisabled={this.selectionDisabled()}
        acceptText={this.state.showOverrideReason ? 'Confirm override' : 'Select location'}
        bannerRenderer={this.renderTopArea}
      >
        <TabLayout contextType="modal" sidebarWidth={this.props.disableDetails ? 12 : 6}>
          <TabLayoutSidebar noBorder>
            <Card
              noPadding
              className={classNames('location-selector-modal__left', {
                'location-selector-modal__left--large': !this.state.suggestedLocation
              })}
            >
              <LocationTree
                locations={this.getAllowedLocations()}
                nodeState={this.state.nodeState}
                onSelect={this.onTreeSelect}
                onOpen={this.onTreeOpen}
                isSelectDeep={this.props.isSelectDeep}
              />
            </Card>
          </TabLayoutSidebar>
          <div
            className={classNames('location-selector-modal__right', {
              'location-selector-modal__right--large': !this.state.suggestedLocation
            })}
          >
            {(!this.props.disableDetails && this.state.locationId) && (
              this.renderLocationDetails()
            )}
            {this.state.showOverrideReason && (
              this.renderOverrideReason()
            )}
          </div>
        </TabLayout>
      </SinglePaneModal>
    );
  }
}

const LocationSelectorModal = ConnectToStores(LocationSelector, () => ({
  isAssignment: false,
  disableDetails: true,
  container: null
}));
LocationSelectorModal.displayName = 'LocationSelectorModal';
LocationSelectorModal.MODAL_ID = SELECTOR_MODAL_ID;

export const LocationAssignmentModal = ConnectToStores(LocationSelector, () => ({
  isAssignment: true
}));
LocationAssignmentModal.displayName = 'LocationAssignmentModal';
LocationAssignmentModal.MODAL_ID = ASSIGNMENT_MODAL_ID;

export default LocationSelectorModal;
