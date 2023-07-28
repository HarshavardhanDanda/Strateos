/* eslint-disable consistent-return, no-underscore-dangle, camelcase */
import _ from 'lodash';

import Dispatcher from 'main/dispatcher';
import CRUDStore from 'main/util/CRUDStore';

const WarpStore = _.extend({}, CRUDStore('warps'), {
  act(action) {
    switch (action.type) {
      case 'WARPS_API_LIST':
        return this._receiveData(action.entities);

      default:

    }
  },

  filterByInstructionId(instructionId) {
    return this.getAll().filter(warp => warp.get('instruction_id') === instructionId).toList();
  }
});

WarpStore._register(Dispatcher);

export default WarpStore;
