/* eslint-disable consistent-return, no-underscore-dangle, camelcase */
import _ from 'lodash';

import Dispatcher from 'main/dispatcher';
import CRUDStore from 'main/util/CRUDStore';

const LibraryStore = _.extend({}, CRUDStore('libraries'), {
  act(action) {
    switch (action.type) {
      case 'LIBRARIES_API_LIST':
        return this._receiveData(action.entities);

      default:
        return undefined;
    }
  }
});
LibraryStore._register(Dispatcher);

export default LibraryStore;
