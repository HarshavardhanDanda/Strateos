/* eslint-disable consistent-return, no-underscore-dangle, camelcase */
import _ from 'lodash';
import Immutable from 'immutable';

import String from 'main/util/String';
import Dispatcher from 'main/dispatcher';
import CRUDStore from 'main/util/CRUDStore';

const ProtocolStore = _.extend({}, CRUDStore('protocols'), {
  act(action) {
    switch (action.type) {
      case 'PROTOCOL_DATA':
        return this._receiveData([action.protocol]);

      case 'PROTOCOL_LIST':
        return this._receiveData(action.protocols);

      default:

    }
  },

  getAllSorted() {
    return this.getAll().sortBy(p => p.get('created_at'));
  },

  getAllPublic() {
    return this.getAllSorted().filter(pr => pr.getIn(['package', 'public']));
  },

  getAllPrivate() {
    return this.getAllSorted().filter(pr => !pr.getIn(['package', 'public']));
  },

  getAllWithCategory(category) {
    // Only show public protocols in the categorised list.
    return this.getAllPublic().filter(pr => pr.get('categories') && pr.get('categories').contains(category));
  },

  getAllForPackage(package_id) {
    return this.getAll().filter(p => p.get('package_id') === package_id);
  },

  getAllForName(package_id, name) {
    return this.getAllForPackage(package_id)
      .groupBy(p => p.get('name'))
      .get(name, Immutable.Map())
      .sort(this.sortByVersion);
  },

  filterForOrg(protocols, orgId) {
    return protocols.filter((pr) => (pr.getIn(['package', 'public'])) || (orgId === pr.getIn(['package', 'organization_id'])));
  },

  protocolsForRelease({ package_id, release_id }) {
    return this.getAllForPackage(package_id)
      .filter(p => p.get('release_id') === release_id);
  },

  protocolsByName(package_id) {
    return this.getAllForPackage(package_id)
      .groupBy(p => p.get('name'));
  },

  protocolsForName(package_id, protocolName) {
    return this.protocolsByName(package_id)
      .get(protocolName)
      .sort(this.sortByVersion);
  },

  filterLatest(protocols) {
    const protocolsByName = protocols.groupBy(p => `${p.get('package_name')}.${p.get('name')}`);

    const latestByName = protocolsByName.map((group) => {
      return group.sort(this.sortByVersion).last();
    }
    );

    return latestByName.valueSeq();
  },

  sortByVersion(pr1, pr2) {
    return String.semanticCompare(pr1.get('version'), pr2.get('version'));
  }
});

ProtocolStore._register(Dispatcher);

export default ProtocolStore;
