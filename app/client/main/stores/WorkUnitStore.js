/* eslint-disable consistent-return, no-underscore-dangle, camelcase */
import _ from 'lodash';

import Dispatcher from 'main/dispatcher';
import CRUDStore from 'main/util/CRUDStore';

const WorkUnitStore = _.extend({}, CRUDStore('work_units'), {
  act(action) {
    switch (action.type) {
      case 'WORK_UNITS_API_LIST':
        return this._receiveData(action.entities);

      case 'WORKCELLS_EMPTY':
        return this._empty();

      default:
        return undefined;
    }
  }
});
WorkUnitStore._register(Dispatcher);

export default WorkUnitStore;
