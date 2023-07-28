import Immutable from 'immutable';
import _ from 'lodash';
import ImmutableUtil from 'main/util/ImmutableUtil';

const LocationTreeLogic = {
  addDefault(nodeState, locationId) {
    return nodeState.set(
      locationId,
      nodeState.get(locationId, Immutable.Map())
    );
  },

  exclusiveSelect(nodeState, locationId) {
    nodeState = this.addDefault(nodeState, locationId);

    return nodeState.map((locationState, _locationId) =>
      locationState.set('isSelected', locationId === _locationId)
    );
  },

  closeAll(nodeState) {
    return nodeState.map((locationState, _locationId) =>
      locationState.set('isOpen', 'false')
    );
  },

  setBusy(nodeState, locationId, busy) {
    nodeState = this.addDefault(nodeState, locationId);

    return nodeState.setIn([locationId, 'isBusy'], busy);
  },

  setOpen(nodeState, locationId, open) {
    nodeState = this.addDefault(nodeState, locationId);

    return nodeState.setIn([locationId, 'isOpen'], open);
  },

  setDeepLoaded(nodeState, locationId, loaded) {
    nodeState = this.addDefault(nodeState, locationId);

    return nodeState.setIn([locationId, 'isDeepLoaded'], loaded);
  },

  isOpen(nodeState, locationId) {
    if (locationId != undefined) {
      return nodeState.getIn([locationId, 'isOpen'], false);
    } else {
      // root node defaults to open
      return nodeState.getIn([locationId, 'isOpen'], true);
    }
  },

  openPath(nodeState, locationId, locations) {
    const locationMap = ImmutableUtil.indexBy(locations, 'id');
    const pathIds = [locationId];

    let currentId = locationId;
    while (currentId != undefined) {

      const parentId  = locationMap.getIn([currentId, 'parent_id']);
      const ancestors = locationMap.getIn([currentId, 'ancestors'], Immutable.List());
      currentId       = parentId != undefined ? parentId : ancestors.last();

      pathIds.push(currentId);
    }

    for (let i = 0; i < pathIds.length; i++) {
      const id = pathIds[i];

      nodeState = this.setOpen(nodeState, id, true);
    }

    return nodeState;
  }
};

export default LocationTreeLogic;
