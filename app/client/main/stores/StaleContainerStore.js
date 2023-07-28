/* eslint-disable consistent-return, no-underscore-dangle, camelcase */
import _ from 'lodash';

import CRUDStore      from 'main/util/CRUDStore';
import Dispatcher     from 'main/dispatcher';
import ajax           from 'main/util/ajax';

const StaleContainerStore = _.extend({}, CRUDStore('stale_containers'), {

  act(action) {
    switch (action.type) {
      case 'STALE_CONTAINERS_DATA':
        return this._receiveData([action.stale_containers]);

      case 'STALE_CONTAINERS_SEARCH_RESULTS':
        return this._receiveData(action.results);

      case 'STALE_CONTAINERS_API_LIST':
        return this._receiveData(action.entities.map(ajax.camelcase));

      default:

    }
  },

  getByContainerId(containerId) {
    return this.find(stale => stale.get('containerId') === containerId);
  }

});

StaleContainerStore._register(Dispatcher);

export default StaleContainerStore;
