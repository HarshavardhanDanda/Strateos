import SessionStore from 'main/stores/SessionStore';
import { UserPersistence } from '@transcriptic/amino';
import _ from 'lodash';

const UserPreference = {
  get(key) {
    if (!key) {
      return;
    }
    return UserPersistence.get(this.packInfo(key));
  },

  save(preferences) {
    _.map(preferences, (value, key) => {
      UserPersistence.save(this.packInfo(key), value);
    });
  },

  remove(key) {
    UserPersistence.remove(this.packInfo(key));
  },

  packInfo(key) {
    if (!key || !(SessionStore.getUser() && SessionStore.getUser().get('id'))) {
      return;
    }

    try {
      const orgId = SessionStore.getOrg() ? SessionStore.getOrg().get('id', '_') : '_';
      const userId = SessionStore.getUser().get('id');
      return {
        appName: 'Web', // Strateos Web repo name
        orgId: orgId,
        userId: userId,
        key: key // Must be unique key term in your App
      };
    } catch (e) {
      // silently handling the exception
    }
  }
};

export default UserPreference;
