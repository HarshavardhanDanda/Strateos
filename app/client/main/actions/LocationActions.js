/* eslint-disable camelcase */
import _ from 'lodash';

import LocationStore from 'main/stores/LocationStore';
import Dispatcher from 'main/dispatcher';
import ajax from 'main/util/ajax';
import Urls from 'main/util/urls';
import NotificationActions from 'main/actions/NotificationActions';

const LocationActions = {
  root(options) {
    const url = `${Urls.locations_api()}/root`;

    return ajax.get(url, {
      options
    })
      .done(location => Dispatcher.dispatch({
        type: 'LOCATION_DATA',
        location
      }));
  },

  loadLocation(id, options = {}) {
    const url = `${Urls.locations_api()}/${id}`;
    return ajax.get(url, options)
      .done(response => {
        const data = response.data;
        const children = [];
        const containers = [];
        response.included && response.included.forEach((includedEntity) => {
          if (includedEntity.type === 'locations') {
            const { id, attributes } = includedEntity;
            const tempLocation = {
              id,
              ...attributes
            };
            children.push(tempLocation);
          } else if (includedEntity.type === 'containers') {
            const { id, attributes } = includedEntity;
            const tempContainer = {
              id,
              ...attributes
            };
            containers.push(tempContainer);
          }
        });
        const location = { id: data.id, ...data.attributes, children: children, containers: containers };
        Dispatcher.dispatch({
          type: 'LOCATION_DATA',
          location
        });
      });
  },

  loadDeep(id, options) {
    let url;
    if (id) {
      url = `${Urls.locations_api()}/${id}/load_deep`;
    } else {
      url = `${Urls.locations_api()}/load_deep_root`;
    }

    return ajax.get(url, {
      options
    })
      .done(locations => Dispatcher.dispatch({
        type: 'LOCATION_LIST',
        locations
      }));
  },

  loadDeepContainers(location_id, options) {
    const url = Urls.location_deep_containers_api(location_id);

    return ajax.get(url, {
      options
    })
      .done((containers) => {
        Dispatcher.dispatch({
          type: 'CONTAINER_LIST',
          containers
        });
      });
  },

  loadRegions(options) {
    const url = `${Urls.locations_api()}?filter[category]=region`;

    return ajax.get(url, {
      options
    })
      .done(regions => {
        Dispatcher.dispatch({
          type: 'REGIONS_LIST',
          regions
        });
      })
      .fail((...response) => NotificationActions.handleError(...response));

  },

  createLocation(location, rows, cols, cellHeightMM) {
    const requestBody = {
      attributes: {
        location,
        rows,
        cols,
        cell_height_mm: cellHeightMM
      }
    };

    return ajax.post(`${Urls.locations_api()}`,
      { data: requestBody })
      .done((data) => {
        Dispatcher.dispatch({
          type: 'LOCATION_CREATED',
          location: data
        });
      })
      .fail((...response) => NotificationActions.handleError(...response));
  },

  updateLocation(id, updates, optimisticallyUpdate = true) {
    // Optimistically update page to avoid flashing old data.
    if (optimisticallyUpdate) {
      Dispatcher.dispatch({
        type: 'LOCATION_DATA',
        location: _.extend({
          id
        }, updates)
      });
    }
    const requestBody = {
      attributes: {
        location: updates
      }
    };

    return ajax.put(`${Urls.locations_api()}/${id}`, {
      data: requestBody
    })
      .done((data) => {
        Dispatcher.dispatch({
          type: 'LOCATION_DATA',
          location: data
        });
      })
      .fail((...response) => NotificationActions.handleError(...response));
  },

  destroyLocation(id) {
    const destroyedLocation = LocationStore.location(id);
    return ajax.delete(`${Urls.locations_api()}/${id}`)
      .done(() => {
        Dispatcher.dispatch({
          type: 'LOCATION_DESTROYED',
          id,
          location: destroyedLocation
        });
      })
      .fail((xhr, status, text) => {
        NotificationActions.handleError(xhr, status, text);
      });
  },

  searchLocationsByName(name, options, json_format = 'full') {
    const url = `${Urls.locations_api()}/search`;

    return ajax.get(url, {
      location: {
        name
      },
      options,
      json_format
    })
      .done(locations => Dispatcher.dispatch({
        type: 'LOCATION_SEARCH_RESULTS',
        locations
      }))
      .fail((...response) => NotificationActions.handleError(...response));
  },

  relocateLocation(id, parent_id) {

    const requestBody = {
      attributes: {
        location: { parent_id }
      }
    };

    return ajax.put(`${Urls.locations_api()}/${id}`, { data: requestBody })
      .done((data) => {
        Dispatcher.dispatch({
          type: 'LOCATION_DATA',
          location: data
        });
      })
      .fail((...response) => NotificationActions.handleError(...response));
  }
};

export default LocationActions;
