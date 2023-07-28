/* eslint-disable consistent-return, no-underscore-dangle, camelcase */
import _ from 'lodash';

import CRUDStore from 'main/util/CRUDStore';
import Dispatcher from 'main/dispatcher';

const CompoundStore = _.extend({}, CRUDStore('compounds'), {
  act(action) {
    switch (action.type) {
      case 'COMPOUNDS_API_LIST':
        return this._receiveData(action.entities);

      case 'COMPOUNDS_SEARCH_RESULTS':
        return this._receiveData(action.results);

      default:
        return undefined;
    }
  }
});

CompoundStore._register(Dispatcher);

export default CompoundStore;
