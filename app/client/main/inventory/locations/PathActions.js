import ContainerActions from 'main/actions/ContainerActions';
import LocationActions from 'main/actions/LocationActions';
import Dispatcher from 'main/dispatcher';

const PathActions = {
  navigate(locationId) {
    if (locationId != undefined) {
      LocationActions.loadLocation(locationId);
    }

    Dispatcher.dispatch({
      type: 'PATH_NAVIGATE',
      id: locationId
    });
  },

  navigateRoot() {
    this.navigate(undefined);
  },

  showContainer(containerId, locationId) {
    LocationActions.loadLocation(locationId);
    ContainerActions.load(containerId);

    Dispatcher.dispatch({
      type: 'PATH_SELECT_CONTAINER',
      containerId,
      locationId
    });
  },

  toggleLocationDetails() {
    Dispatcher.dispatch({
      type: 'PATH_TOGGLE_LOCATION_DETAILS'
    });
  },

  showSearcher(value) {
    Dispatcher.dispatch({
      type: 'PATH_SHOW_SEARCHER',
      value
    });
  }
};

export default PathActions;
