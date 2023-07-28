/* eslint-disable consistent-return, no-underscore-dangle, camelcase */
import _ from 'lodash';

import Dispatcher from 'main/dispatcher';
import CRUDStore from 'main/util/CRUDStore';

const MaterialStore = _.extend({}, CRUDStore('materials'), {
  act(action) {
    switch (action.type) {
      case 'MATERIALS_SEARCH_RESULTS':
        return this._receiveData(action.results);

      case 'MATERIALS_DATA':
        return this._receiveData(action.results);

      case 'MATERIALS_DELETED':
        return  this._remove(action.materialId);

      case 'MATERIALS_API_LIST':
        return this._receiveData(action.entities);

      default:

    }
  },

  getSisterMaterials(mat) {
    const material = _.extend({}, mat);
    const sisterMaterials = material.sister_materials || [];
    const updatedMaterials = [];
    /* Updating each sister material by adding all other sister materails and related main material to it */
    sisterMaterials.forEach((ma, index) => {
      const sister_materials = sisterMaterials.filter((sismaterial) => sismaterial.id !== ma.id);
      updatedMaterials[index] = { ...ma, sister_materials: sister_materials.concat(material) };
    });
    return updatedMaterials;
  }
});

MaterialStore._register(Dispatcher);

export default MaterialStore;
