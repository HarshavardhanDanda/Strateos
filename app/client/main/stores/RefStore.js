/* eslint-disable consistent-return, no-underscore-dangle, camelcase */
import _ from 'lodash';

import Dispatcher from 'main/dispatcher';
import CRUDStore from 'main/util/CRUDStore';

const RefStore = _.extend({}, CRUDStore('refs'), {
  act(action) {
    switch (action.type) {
      case 'REFS_API_LIST':
        this._receiveData(action.entities);
        break;

      default:
        return undefined;
    }
  },

  getByRunId(runId) {
    return this.getAll()
      .filter(ref => ref.get('run_id') === runId);
  }
});

RefStore._register(Dispatcher);

export default RefStore;
