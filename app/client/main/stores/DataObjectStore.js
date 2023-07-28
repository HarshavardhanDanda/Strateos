/* eslint-disable consistent-return, no-underscore-dangle, camelcase */
import _ from 'lodash';

import CRUDStore from 'main/util/CRUDStore';
import Dispatcher from 'main/dispatcher';

const DataObjectStore = _.extend({}, CRUDStore('data_objects'), {
  act(action) {
    switch (action.type) {
      case 'DATA_OBJECT_DATA':
        return this._receiveData([action.dataObject]);

      case 'DATA_OBJECTS_API_LIST':
        return this._receiveData(action.entities);

      default:
    }
  }
});

DataObjectStore._register(Dispatcher);

export default DataObjectStore;
