/* eslint-disable consistent-return, no-underscore-dangle, camelcase */
import CRUDStore from 'main/util/CRUDStore';
import Dispatcher from 'main/dispatcher';

import _ from 'lodash';

const STRATEOS_GROUP_KEY = 'com.transcriptic';

const OrganizationStore = _.extend({}, CRUDStore('organizations'), {

  act(action) {
    switch (action.type) {
      case 'ORGANIZATIONS_API_LIST':
        return this._receiveData(action.entities);

      case 'ORGANIZATION_DATA':
        return this._receiveData([action.organization]);

      case 'ORGANIZATION_LIST':
        return this._receiveData(action.organizations);

      case 'ORGANIZATION_SEARCH_RESULTS':
        return this._receiveData(action.results);

      case 'IMPLEMENTATION_DATA': {
        const { implementation, customer } = action.implementation;
        return this._receiveData([implementation, customer]);
      }

      case 'SESSION_DATA': {
        if (action.session.organization) {
          return this._receiveData([action.session.organization]);
        }
        break;
      }

      case 'ORGANIZATION_DESTROYED':
        return this._remove(action.orgId);

      default:

    }
  },

  findBySubdomain(subdomain) {
    return this.getAll().find(org => org.get('subdomain') === subdomain);
  },

  findByName(name) {
    return this.getAll().find(org => org.get('name') === name);
  },

  isTestAccount(org) {
    return org.get('test_account');
  },

  isStrateosAccount(org) {
    return org.get('group', '') === STRATEOS_GROUP_KEY;
  }
});

OrganizationStore._register(Dispatcher);

export default OrganizationStore;
