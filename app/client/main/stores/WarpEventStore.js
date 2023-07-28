/* eslint-disable consistent-return, no-underscore-dangle, camelcase */
import _ from 'lodash';

import CRUDStore from 'main/util/CRUDStore';
import Dispatcher from 'main/dispatcher';

const WarpEventStore = _.extend({}, CRUDStore('warp_event_errors'), {
  act(action) {
    switch (action.type) {
      case 'WARP_EVENT_ERROR_LIST':
        return this._receiveData(action.warpEventErrors);

      default:

    }
  },

  getAllByWarpStateAndRunId(runId, warpState) {
    return this.getAll()
      .filter((warpEvent) => {
        const warpEventRunId = warpEvent.get('warp').get('run_id');
        return warpEvent.get('warp_state') === warpState && warpEventRunId === runId;
      })
      .toList();
  }
}
);

WarpEventStore._register(Dispatcher);

export default WarpEventStore;
