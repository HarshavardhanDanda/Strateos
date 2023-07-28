/* eslint-disable consistent-return, no-underscore-dangle, camelcase */
import _ from 'lodash';

import Dispatcher from 'main/dispatcher';
import CRUDStore from 'main/util/CRUDStore';

const AliquotCompoundLinkStore = _.extend({}, CRUDStore('aliquot_compound_links'), {
  act(action) {
    switch (action.type) {
      case 'ALIQUOT_COMPOUND_LINKS_API_LIST':
        return this._receiveData(action.entities);

      default:
        return undefined;
    }
  },

  getByAliquotAndCompoundLinkId(aliquotId, compoundLinkId) {
    return this.getAll()
      .filter((link) => (link.get('aliquot_id') === aliquotId && link.get('compound_link_id') === compoundLinkId))
      .toList();
  },

  getByAliquotId(aliquotId) {
    return this.getAll().filter((link) => link.get('aliquot_id') === aliquotId).toList();
  }
});

AliquotCompoundLinkStore._register(Dispatcher);

export default AliquotCompoundLinkStore;
