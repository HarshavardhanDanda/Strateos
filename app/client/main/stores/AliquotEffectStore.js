/* eslint-disable consistent-return, no-underscore-dangle, camelcase, no-null/no-null */
import _ from 'lodash';

import Dispatcher from 'main/dispatcher';
import CRUDStore from 'main/util/CRUDStore';

const AliquotEffectStore = _.extend({}, CRUDStore('aliquot_effects'), {
  act(action) {
    switch (action.type) {

      case 'ALIQUOT_EFFECT_DATA':
        return this._receiveData([action.aliquotEffect]);

      case 'ALIQUOT_EFFECT_LIST':
        return this._receiveData(action.aliquotEffects);

      case 'ALIQUOT_EFFECTS_API_LIST':
        return this._receiveData(action.entities);

      default:

    }
  },

  getByAliquot(container_id, well_idx) {
    return this.getAll().filter(ae =>
      ae.get('affected_container_id') === container_id &&
      ae.get('affected_well_idx') === well_idx
    );
  }
});

AliquotEffectStore._register(Dispatcher);

export default AliquotEffectStore;
