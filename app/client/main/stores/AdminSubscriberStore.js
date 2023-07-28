/* eslint-disable consistent-return, no-underscore-dangle, camelcase */
import Immutable from 'immutable';

import rootNode from 'main/state/rootNode';
import Dispatcher from 'main/dispatcher';
import AdminStore from 'main/stores/AdminStore';

const AdminSubscriberStore = {
  act(action) {
    switch (action.type) {
      case 'ADMIN_SUBSCRIBER_LIST':
        return this.receiveMany(action.subdomain, action.admins.map(a => a.id));

      case 'ADMIN_SUBSCRIBER_DATA':
        return this.receiveMany(action.subdomain, [action.adminId]);

      case 'ADMIN_SUBSCRIBER_DESTROYED':
        return this.remove(action.subdomain, action.adminId);

      default:

    }
  },
  // Stores a mapping from org subdomain -> Set(adminId)
  _data: rootNode.sub(['admin_subscriber_store'], Immutable.Map()),

  register() {
    this.dispatchToken = Dispatcher.register(this.act.bind(this));
  },

  receiveMany(subdomain, adminIds) {
    adminIds.forEach(adminId => this._data.setIn([subdomain, adminId], true));
  },

  remove(subdomain, adminId) {
    this._data.removeIn([subdomain, adminId]);
  },

  getAllBySubdomain(subdomain) {
    const adminIds = this._data.get(subdomain, Immutable.Map()).keySeq();

    return AdminStore.getByIds(adminIds)
      .filter(admin => admin != undefined);
  }
};

AdminSubscriberStore.register(Dispatcher);

export default AdminSubscriberStore;
