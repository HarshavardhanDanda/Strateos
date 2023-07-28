import ajax from 'main/util/ajax';
import HTTPUtil            from 'main/util/HTTPUtil';
import Dispatcher from 'main/dispatcher';
import API from './API';

class LocationsAPI extends API {
  constructor() {
    super('locations');
  }

  load_deep_root() {
    return ajax.get(`${this.createUrl('')}/load_deep_root`)
      .done(payload => {
        Dispatcher.dispatch({ type: 'LOCATION_LIST', locations: payload });
      });
  }

  loadLocation(id, options) {
    const url = `/api/locations/${id !== undefined ? id : 'root'}`;

    return ajax.get(url, { options })
      .done(response => {
        const location = id !== undefined ? { id: response.data.id, ...response.data.attributes } : response;
        Dispatcher.dispatch({ type: 'LOCATION_DATA', location });
      });
  }

  loadDeep(id, options) {
    let url;
    if (id) {
      url = `/api/locations/${id}/load_deep`;
    } else {
      return this.load_deep_root();
    }

    return HTTPUtil.get(url, { options })
      .done(locations => Dispatcher.dispatch({ type: 'LOCATION_LIST', locations }));
  }

  loadDeepContainers(id) {
    return ajax.get(`${this.createUrl('')}/${id}/load_deep_containers`)
      .done(payload => {
        Dispatcher.dispatch({ type: 'CONTAINER_LIST', containers: payload });
      });
  }

  searchLocationsByName(name, json_format = 'full', labId = '', options = {}) {
    const data = { location: { name, ...(labId && { lab_id: labId }) }, json_format };
    const url  = `${this.createUrl('', data)}/search`;

    return HTTPUtil.get(url, { data, options })
      .done(locations => Dispatcher.dispatch({ type: 'LOCATION_SEARCH_RESULTS', locations }));

  }

  pickLocationForContainer(containerId) {
    const url  = `${this.createUrl('', data)}/pick_location_for_container`;
    const data = { container_id: containerId };
    return HTTPUtil.get(url, { data })
      .done(({ location }) => {
        if (location) {
          Dispatcher.dispatch({ type: 'LOCATION_DATA', location });
        }
      });
  }
}

export default new LocationsAPI();
