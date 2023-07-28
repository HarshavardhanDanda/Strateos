/* eslint-disable consistent-return, no-underscore-dangle, camelcase */
import _ from 'lodash';

import Dispatcher from 'main/dispatcher';
import CRUDStore from 'main/util/CRUDStore';

const BillingContactStore = _.extend({}, CRUDStore('billing_contacts'), {
  act(action) {
    switch (action.type) {
      case 'BILLING_CONTACT_LIST':
        return this._receiveData(action.billing_contacts);

      case 'BILLING_CONTACT_DESTROYED':
        return this._remove(action.contactId);

      case 'BILLING_CONTACT_DATA':
        return this._receiveData([action.billing_contact]);

      default:

    }
  },

  getAllByOrganizationId(organizationId) {
    return this.getAll()
      .filter(contact => contact.get('organization_id') === organizationId);
  }
});

BillingContactStore._register(Dispatcher);

export default BillingContactStore;
