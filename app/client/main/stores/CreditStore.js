/* eslint-disable consistent-return, no-underscore-dangle, camelcase */
import _ from 'lodash';

import Dispatcher from 'main/dispatcher';
import CRUDStore from 'main/util/CRUDStore';

const CreditStore = _.extend({}, CRUDStore('credits'), {
  act(action) {
    switch (action.type) {
      case 'CREDIT_LIST':
        return this._receiveData(action.credits);

      case 'CREDIT_DATA':
        return this._receiveData([action.credit]);

      case 'CREDITS_API_LIST':
        return this._receiveData(action.entities);

      default:

    }
  },

  getAllByOrgId(id) {
    return this.getAll().filter(c => c.get('organization_id') === id).toList();
  },

  hasMoneyLeft(credit) {
    return credit.get('amount_remaining') > 0;
  }
});

CreditStore._register(Dispatcher);

export default CreditStore;
