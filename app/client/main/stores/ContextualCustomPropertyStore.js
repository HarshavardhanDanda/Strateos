/* eslint-disable consistent-return, no-underscore-dangle, camelcase */
import _ from 'lodash';
import Dispatcher from 'main/dispatcher';
import CRUDStore from 'main/util/CRUDStore';

const ContextualCustomPropertyStore = _.extend({}, CRUDStore('contextual_custom_properties'), {
  act(action) {
    switch (action.type) {
      case 'CONTEXTUAL_CUSTOM_PROPERTIES_API_LIST':
        return this._receiveData(action.entities);
      default:
    }
  },
  getCustomProperties(contextId, contextType) {
    return this.getAll().filter(cmp => {
      return cmp.get('context_id') === contextId && cmp.get('context_type') === contextType;
    }).toList();
  },
});

ContextualCustomPropertyStore._register(Dispatcher);

export default ContextualCustomPropertyStore;
