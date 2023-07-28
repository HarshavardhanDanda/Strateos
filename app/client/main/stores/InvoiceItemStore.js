/* eslint-disable consistent-return, no-underscore-dangle, camelcase */
import _ from 'lodash';

import Dispatcher from 'main/dispatcher';
import CRUDStore from 'main/util/CRUDStore';

const InvoiceItemStore = _.extend({}, CRUDStore('invoice_items'), {
  act(action) {
    switch (action.type) {
      case 'INVOICE_ITEMS_API_LIST':
        return this._receiveData(action.entities);

      default:
    }
  },

  getAllUnlinkedByOrg(orgId) {
    return this.getAll().filter((ii) => {
      return ii.get('organization_id') === orgId && !ii.get('invoice_id');
    });
  }
});

InvoiceItemStore._register(Dispatcher);

export default InvoiceItemStore;
