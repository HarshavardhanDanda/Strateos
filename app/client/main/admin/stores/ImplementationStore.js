/* eslint-disable no-underscore-dangle */
import _ from 'lodash';

import CRUDStore from 'main/util/CRUDStore';
import Dispatcher from 'main/dispatcher';

const ImplementationStore = _.extend({}, CRUDStore('implementation', true), {
  act(action) {
    switch (action.type) {
      case 'IMPLEMENTATION_DATA':
        this._empty();
        this._receiveData([action.implementation]);
        break;

      default:

    }
  }
});

ImplementationStore._register(Dispatcher);

export default ImplementationStore;
