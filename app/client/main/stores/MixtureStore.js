import _ from 'lodash';

import CRUDStore           from 'main/util/CRUDStore';
import Dispatcher          from 'main/dispatcher';

const MixtureStore = _.extend({}, CRUDStore('mixtures'), {
  act(action) {
    switch (action.type) {
      case 'MIXTURES_LIST':
        return this._receiveData(action.mixtures);

      default:

    }
  },
});

MixtureStore._register(Dispatcher);

export default MixtureStore;
