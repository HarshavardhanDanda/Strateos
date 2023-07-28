import _         from 'lodash';

import CRUDStore  from 'main/util/CRUDStore';
import Dispatcher from 'main/dispatcher';

let lastSearch = [];

const ContainerDestructionStore = _.extend({}, CRUDStore('container_destructions'), {

  getLastSearch() {
    return this.getByIds(lastSearch);
  },

  act(action) {
    switch (action.type) {

      case 'CONTAINER_DESTRUCTION_REQUEST_DATA':
        return this._receiveData(action.containerDestruction);

      case 'CONTAINER_DESTRUCTION_SEARCH_RESULTS':
        lastSearch = action.results.map(x => x.id.toString());
        return this._receiveData(action.results);

      case 'CONTAINER_DESTRUCTION_REQUEST_DELETED':
        return this._remove(action.destructionRequestId);

      default:
        return undefined;
    }
  },

  getAllByContainerId(containerId) {
    return this.getAll().filter(r => r.get('containerId') === containerId);
  }
});

ContainerDestructionStore._register(Dispatcher);

export default ContainerDestructionStore;
