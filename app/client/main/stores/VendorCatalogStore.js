import _ from 'lodash';

import Dispatcher from 'main/dispatcher';
import CRUDStore from 'main/util/CRUDStore';

const VendorCatalogStore = _.extend({}, CRUDStore('emolecules'), {
  act(action) {
    switch (action.type) {
      case 'VENDOR_CATALOG_SEARCH_RESULTS':
        return this._receiveData(action.results);
      default:
    }
  }
});

VendorCatalogStore._register(Dispatcher);

export default VendorCatalogStore;
