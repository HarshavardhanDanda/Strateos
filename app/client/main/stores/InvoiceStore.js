/* eslint-disable consistent-return, no-underscore-dangle, camelcase */
import _ from 'lodash';

import Dispatcher from 'main/dispatcher';
import CRUDStore from 'main/util/CRUDStore';

const InvoiceStore = _.extend({}, CRUDStore('invoices'), {
  act(action) {
    switch (action.type) {
      case 'INVOICE_LIST':
        return this._receiveData(action.invoices);

      case 'INVOICES_SEARCH_RESULTS':
        return this._receiveData(action.results);

      default:
    }
  },

  // Get all invoice items that have been charged.
  getAllClosed() {
    return this.getAll()
      .filter(v => !/^current/.test(v.get('id')));
  },

  // Get the set of months that have at least one invoice for that month.
  getAvailableMonths() {
    return this.getAllClosed()
      .valueSeq()
      .map(x => x.get('month'))
      .toSet()
      .sort()
      .reverse()
      .toList();
  },

  // Get all invoices for a given month.
  getAllForMonth(month) {
    return this.getAllClosed()
      .valueSeq()
      .filter(x => x.get('month') === month)
      .toList();
  },

  getAllForOrg(orgId) {
    return this
      .getAll()
      .filter(i => orgId === i.get('organization_id') || i.getIn(['organization', 'id']));
  },

  hasBeenCharged(invoice) {
    return typeof invoice.get('charged_at') === 'string';
  },

  hasBeenRemitted(invoice) {
    return typeof invoice.get('remitted_at') === 'string';
  }
});

InvoiceStore._register(Dispatcher);

export default InvoiceStore;
