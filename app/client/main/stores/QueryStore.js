/* eslint-disable consistent-return, no-underscore-dangle, camelcase */
import _ from 'lodash';

import Dispatcher from 'main/dispatcher';
import CRUDStore from 'main/util/CRUDStore';

const QueryStore = _.extend(CRUDStore('queries'), {}, {
  act(action) {
    switch (action.type) {
      case 'QUERY_LIST':
        return this._receiveData(action.queries);

      default:

    }
  }
});

const QueryResultsStore = _.extend(CRUDStore('query_results'), {}, {
  act(action) {
    switch (action.type) {
      case 'QUERY_RESULTS':
        return this._receiveData([action.results]);

      default:

    }
  }
});

QueryStore._register(Dispatcher);
QueryResultsStore._register(Dispatcher);

export { QueryStore, QueryResultsStore };
