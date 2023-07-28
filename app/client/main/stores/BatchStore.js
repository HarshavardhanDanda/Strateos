/* eslint-disable consistent-return, no-underscore-dangle, camelcase */
import _ from 'lodash';

import Dispatcher from 'main/dispatcher';
import CRUDStore from 'main/util/CRUDStore';

const BatchStore = _.extend({}, CRUDStore('batches'), {
  act(action) {
    switch (action.type) {
      case 'BATCHES_API_LIST':
        return this._receiveData(action.entities);

      case 'BATCHES_SEARCH_RESULTS':
        return this._receiveData(action.results);

      default:
        return undefined;
    }
  }
});

BatchStore._register(Dispatcher);

export default BatchStore;
