/* eslint-disable consistent-return, no-underscore-dangle, camelcase */
import _ from 'lodash';

import Dispatcher from 'main/dispatcher';
import CRUDStore from 'main/util/CRUDStore';

const RunScheduleStore = _.extend({}, CRUDStore('run_schedules'), {
  act(action) {
    switch (action.type) {
      case 'RUN_SCHEDULES_API_LIST':
        return this._receiveData(action.entities);

      default:
        return undefined;

    }
  }
});
RunScheduleStore._register(Dispatcher);

export default RunScheduleStore;
