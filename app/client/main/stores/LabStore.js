import Immutable from 'immutable';
import _ from 'lodash';

import Dispatcher from 'main/dispatcher';
import CRUDStore from 'main/util/CRUDStore';

const LabStore = _.extend({}, CRUDStore('labs'), {
  act(action) {
    switch (action.type) {
      case 'LABS_API_LIST':
        return this._receiveData(action.entities);

      default: return undefined;
    }
  },

  getByIds(ids) {
    return Immutable.fromJS(CRUDStore('labs').getByIds(ids))
      .sortBy(lab => lab.get('name'));
  }
});

LabStore._register(Dispatcher);

export default LabStore;
