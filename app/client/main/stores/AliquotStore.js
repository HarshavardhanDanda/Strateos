/* eslint-disable consistent-return, no-underscore-dangle, camelcase */
import _ from 'lodash';

import Dispatcher from 'main/dispatcher';
import CRUDStore from 'main/util/CRUDStore';

const AliquotStore = _.extend({}, CRUDStore('aliquots'), {
  act(action) {
    switch (action.type) {
      case 'ALIQUOT_DATA':
        return this._receiveData([action.aliquot]);

      case 'ALIQUOT_UPDATED':
        return this._receiveData([action.aliquot], true);

      case 'ALIQUOT_LIST':
        return this._receiveData(action.aliquots);

      case 'ALIQUOTS_API_LIST':
        return this._receiveData(action.entities);

      case 'CONTAINER_ALIQUOTS_DELETED': {
        const aliquotIds = this.getByContainer(action.containerId).map(a => a.get('id'));
        return aliquotIds.forEach(id => this._remove(id));
      }

      default:

    }
  },

  getByContainer(containerId) {
    return this.getAll()
      .filter(a => a.get('container_id') === containerId)
      .toList();
  },

  getByContainerAndWellIdx(containerId, wellIdx) {
    return this.getAll()
      .find(a => a.get('container_id') === containerId &&
                          a.get('well_idx') === wellIdx);
  }
});

AliquotStore._register(Dispatcher);

export default AliquotStore;
