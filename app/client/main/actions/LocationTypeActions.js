/* eslint-disable camelcase */
import Dispatcher from 'main/dispatcher';
import Urls from 'main/util/urls';
import ajax from 'main/util/ajax';
import LocationTypeAPI from 'main/api/LocationTypeAPI';
import NotificationActions from 'main/actions/NotificationActions';

const LocationTypeActions = {
  load(id, options) {
    const url = `${Urls.location_types_api()}/${id}`;

    return ajax.get(url, { options })
      .done(locationType => Dispatcher.dispatch({ type: 'LOCATION_TYPE_DATA', locationType }));
  },

  loadAll() {
    return LocationTypeAPI.indexAll()
      .fail((...args) => {
        NotificationActions.handleError(...(args || []));
      });
  }
};

export default LocationTypeActions;
