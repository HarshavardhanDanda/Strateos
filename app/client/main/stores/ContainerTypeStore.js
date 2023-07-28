/* eslint-disable consistent-return, no-underscore-dangle, camelcase */
import _ from 'lodash';

import CRUDStore from 'main/util/CRUDStore';
import Dispatcher from 'main/dispatcher';

const ContainerTypeStore = _.extend({}, CRUDStore('container_types'), {
  _isRetired(containerType) {
    return containerType.get('retired_at') !== null;
  },

  usableContainerTypes() {
    return this.getAll()
      .filter(containerType => !this._isRetired(containerType));
  },

  tubes() {
    return this.getAll()
      .filter(containerType => containerType.get('is_tube'))
      .sortBy(containerType => containerType.get('id'));
  },

  isTube(containerTypeId) {
    return this.getById(containerTypeId).get('is_tube');
  },

  isPlate(containerTypeId) {
    return !this.isTube(containerTypeId);
  },

  act(action) {
    switch (action.type) {
      case 'CONTAINER_TYPE_DATA':
        return this._receiveData([action.containerType]);
      case 'CONTAINER_TYPES_API_LIST':
        return this._receiveData(action.entities);
      default:
    }
  },

  getContainerTypesByWellCount(wellCount) {
    return this.getAll()
      .filter(containerType => containerType.get('well_count') === wellCount);
  },

  getContainerTypeIDsByWellCount(wellCount) {
    return this.getContainerTypesByWellCount(wellCount)
      .map(containerType => containerType.get('id'));
  }
});

ContainerTypeStore._register(Dispatcher);

export default ContainerTypeStore;
