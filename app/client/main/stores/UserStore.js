/* eslint-disable consistent-return, no-underscore-dangle, camelcase */
import _ from 'lodash';

import CRUDStore from 'main/util/CRUDStore';
import Dispatcher from 'main/dispatcher';

const UserStore = _.extend({}, CRUDStore('users'), {

  act(action) {
    switch (action.type) {
      case 'USER_SEARCH_RESULTS':
        return this._receiveData(action.results);

      case 'USER_DATA':
        return this._receiveData([action.user]);

      case 'COLLABORATOR_DATA':
        return this._receiveData([action.collaborator.collaborating]);

      case 'TOPIC_OF_ORG_TYPE_LIST':
        return this._receiveData(action.orgTopics);

      case 'SUBSCRIPTION_LIST':
        return this._receiveData(action.subscriptions);

      case 'USERS_API_LIST':
        return this._receiveData(action.entities);

      default:

    }
  },

  getByEmail(email) { return this.getAll().filter(user => user.get('email') === email).first(); }

});

UserStore._register(Dispatcher);

export default UserStore;
