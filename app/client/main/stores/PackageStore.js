/* eslint-disable consistent-return, no-underscore-dangle, camelcase */
import _ from 'lodash';

import Dispatcher from 'main/dispatcher';
import CRUDStore from 'main/util/CRUDStore';

const PackageStore = _.extend(CRUDStore('packages'), {}, {
  act(action) {
    switch (action.type) {
      case 'PACKAGES_LIST':
        return this._receiveData(action.packages);

      case 'PACKAGE_DATA':
        return this._receiveData([action._package]);

      default:

    }
  },

  getByOrgId(orgId) {
    return this.getAll()
      .filter(_package => _package.get('organization_id') === orgId);
  },

  nameWithoutDomain(packageName) {
    let parts = packageName.split('.');
    parts = parts.slice(2);
    return parts.join('.');
  }
});

PackageStore._register(Dispatcher);

export default PackageStore;
