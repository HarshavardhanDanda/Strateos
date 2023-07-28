/* eslint-disable consistent-return, no-underscore-dangle, camelcase */
import Immutable from 'immutable';
import _ from 'lodash';

import LocationUtil        from 'main/util/LocationUtil';
import ContainerTypeHelper from 'main/helpers/ContainerType';
import ContainerStore      from 'main/stores/ContainerStore';
import CRUDStore           from 'main/util/CRUDStore';
import Dispatcher          from 'main/dispatcher';

const LocationStore = _.extend({}, CRUDStore('locations'), {
  _mergeSubLocations(l) {
    const children = l.children ? l.children : [];
    const ancestors = l.ancestors ? l.ancestors : [];
    // Set the ancestors of our ancestors, since we already know. -- Woah. Word, man.
    const greatAncestors = ancestors.map((a, index) => ancestors.slice(0, index));

    // If the server deigned to give us more information than we asked for,
    // (i.e. info about our ancestors/children), store that too.
    return [l].concat(children).concat(greatAncestors);
  },

  _locationsWithSubLocations(locations) {
    return _.flattenDeep(locations.map(this._mergeSubLocations));
  },

  _receiveLocationData(locations) {
    return this._receiveData(this._locationsWithSubLocations(locations));
  },

  childrenOf(id = undefined) {
    // To distinguish between the case of no-children, and loading-children
    // we return undefined when the 'children' attribute is missing.
    const location = this.getById(id);
    if (!location || !location.has('children')) {
      return undefined;
    }
    return this.getAll().filter(l => l.get('parent_id') === id).toList();
  },

  location(id) {
    return this.getById(id);
  },

  boxDimensions(boxId) {
    const cells = this.getAll().filter(location => location.get('parent_id') === boxId);
    if (!cells.count()) { return undefined; }

    const cellWithMaxRow = cells.maxBy(cell => cell.get('row'));
    const cellWithMaxCol = cells.maxBy(cell => cell.get('col'));
    return {
      numRows: cellWithMaxRow.get('row') + 1,
      numCols: cellWithMaxCol.get('col') + 1
    };
  },

  isBoxLoaded(boxId) {
    const cells = this.getAll().filter(location => location.get('parent_id') === boxId);
    return cells.count() > 0;
  },

  isBoxCell(location) {
    if (!location) { return false; }
    return location.getIn(['location_type', 'category']) === LocationUtil.categories.box_cell;
  },

  // Finds the next location position given the previous position.
  // Positions can also be blacklisted, and will not be chosen.
  nearestAvailableLocation(location, blacklisted = Immutable.Set()) {
    const locationId = location ? location.get('id') : undefined;
    if (!locationId) { return Immutable.Map(); }

    // The location passed as an arg could be a subset of the location's attributes
    const storeLocation = this.getById(locationId);

    if (this.isBoxCell(storeLocation)) {
      const boxId = storeLocation.get('parent_id');
      const { numCols } = this.boxDimensions(boxId);
      const containerType =
        new ContainerTypeHelper({ col_count: numCols });

      const nearestOpenCell = this
        .childrenOf(boxId)
        .filter((cell) => {
          const cellId = cell.get('id');
          if (blacklisted.includes(cellId)) { return false; }
          if (ContainerStore.containersAt(cellId).count()) { return false; }
          return true;
        })
        .sortBy(cell =>
          containerType.robotFromCoordinates({
            x: cell.get('col'),
            y: cell.get('row')
          })
        )
        .first();

      if (nearestOpenCell) {
        return Immutable.Map({ id: nearestOpenCell.get('id') });
      } else {
        return Immutable.Map();
      }
    }
    return Immutable.Map({ id: locationId });
  },

  nextAvailableLocations(location, containersCount, blacklisted = Immutable.Set()) {
    const locationId = location ? location.get('id') : undefined;
    const storeLocation = this.getById(locationId);
    let nextOpenCells = [];

    if (!locationId) { return Immutable.Map(); }

    if (this.isBoxCell(storeLocation)) {
      const boxId = storeLocation.get('parent_id');
      const { numCols } = this.boxDimensions(boxId);
      const containerType = new ContainerTypeHelper({ col_count: numCols });

      const currentPosition = containerType.robotFromCoordinates({
        x: storeLocation.get('col'),
        y: storeLocation.get('row')
      });

      const openCells = this
        .childrenOf(boxId)
        .filter((cell) => {
          const cellId = cell.get('id');
          if (blacklisted.includes(cellId)) { return false; }
          if (ContainerStore.containersAt(cellId).count()) { return false; }
          return true;
        })
        .sortBy(cell =>
          containerType.robotFromCoordinates({
            x: cell.get('col'),
            y: cell.get('row')
          })
        );

      nextOpenCells = [...openCells];
      openCells.forEach((cell) => {
        const position = containerType.robotFromCoordinates({
          x: cell.get('col'),
          y: cell.get('row')
        });

        if (position < currentPosition) nextOpenCells.push(nextOpenCells.shift());
      });
    }

    return nextOpenCells.slice(0, containersCount);
  },

  filterSingleCapacity(locations) {
    return locations.filter(l =>
      l.getIn(['location_type', 'category']) === 'box_cell'
    );
  },

  locationsByLabId(labId) {
    return this.getAll().filter(l =>
      l.get('lab_id') === labId);
  },

  act(action) {
    switch (action.type) {
      case 'LOCATION_CREATED': case 'LOCATION_DATA':
        return this._receiveLocationData([action.location]);

      case 'LOCATION_LIST':
        return this._receiveLocationData(action.locations);

      case 'LOCATION_SEARCH_RESULTS':
        return this._receiveLocationData(action.locations);

      case 'LOCATION_DESTROYED':
        return this._remove(action.id);

      case 'LOCATIONS_API_LIST':
        return this._receiveData(action.entities);

      case 'REGIONS_LIST':
        return this._receiveData(action.regions);

      default:
        return undefined;
    }
  }
});

LocationStore._register(Dispatcher);

export default LocationStore;
