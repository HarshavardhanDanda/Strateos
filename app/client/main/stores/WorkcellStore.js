/* eslint-disable consistent-return, no-underscore-dangle, camelcase */
import _ from 'lodash';

import CRUDStore from 'main/util/CRUDStore';
import Dispatcher from 'main/dispatcher';

const WorkcellStore = _.extend({}, CRUDStore('workcells'), {
  act(action) {
    switch (action.type) {
      case 'WORKCELLS_API_LIST':
        return this._receiveData(action.entities);

      case 'WORKCELLS_SEARCH_RESULTS':
        return this._receiveData(action.results);

      case 'WORKCELLS_EMPTY':
        return this._empty();

      default:
        return undefined;
    }
  },

  getByLabId(labId) {
    return this.getAll()
      .filter((workcell) => workcell.get('lab_id') === labId);
  },

  getByWorkcellId(workcellId) {
    const [workcell] = this.getAll().filter(workcell => workcell.get('workcell_id') == workcellId);
    return workcell;
  }
});

WorkcellStore._register(Dispatcher);

export default WorkcellStore;
