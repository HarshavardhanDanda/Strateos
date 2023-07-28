import _ from 'lodash';

import Dispatcher from 'main/dispatcher';
import CRUDStore from 'main/util/CRUDStore';

const ReactionStore = _.extend({}, CRUDStore('reactions'), {
  act(action) {
    switch (action.type) {
      case 'REACTIONS_API_LIST':
        return this._receiveData(action.entities);

      default:
        return undefined;
    }
  }
});

ReactionStore._register(Dispatcher);

export default ReactionStore;
