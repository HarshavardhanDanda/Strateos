/* eslint-disable consistent-return, no-underscore-dangle */
import _ from 'lodash';

import Dispatcher from 'main/dispatcher';
import CRUDStore  from 'main/util/CRUDStore';

const ModalStore = _.extend({}, CRUDStore('modal'), {
  act(action) {
    switch (action.type) {
      case 'MODAL_DATA':
        return this._receiveData([action.modal]);

      case 'MODAL_REMOVED':
        return this._remove(action.id);

      default:

    }
  }
});

ModalStore._register(Dispatcher);

export default ModalStore;
