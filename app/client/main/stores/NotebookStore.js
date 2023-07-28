/* eslint-disable consistent-return, no-underscore-dangle, camelcase */
import _ from 'lodash';

import CRUDStore from 'main/util/CRUDStore';
import Dispatcher from 'main/dispatcher';

const NotebookStore = _.extend({}, CRUDStore('notebooks'), {
  act(action) {
    switch (action.type) {
      case 'NOTEBOOK_LIST':
        return this._receiveData(action.notebooks);

      case 'NOTEBOOK_DATA':
        return this._receiveData([action.notebook]);

      case 'NOTEBOOK_DESTROYED':
        return this._remove(action.id);

      default:

    }
  },

  getAllByUserId(user_id) {
    return this.getAll().filter(n => n.get('user_id') === user_id);
  }
});

NotebookStore._register(Dispatcher);

export default NotebookStore;
