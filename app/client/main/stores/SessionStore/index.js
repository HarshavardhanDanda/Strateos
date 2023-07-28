/* eslint-disable consistent-return, no-underscore-dangle, camelcase */
import _ from 'lodash';
import * as Immutable from 'immutable';

import Dispatcher from 'main/dispatcher';
import rootNode from 'main/state/rootNode';
import FeatureConstants         from '@strateos/features';
import FeatureStore from 'main/stores/FeatureStore';
import AcsControls              from  'main/util/AcsControls';

// Longer term architecture:
// The Store shouldn't need to worry about whether the data is loaded or not.
// No view should be requesting store data before the store is loaded.

const node = rootNode.sub('session', Immutable.Map());

const SessionStore = {
  act(action) {
    switch (action.type) {
      case 'SESSION_DATA': {
        node.set(Immutable.fromJS(action.session));
        break;
      }
      // Prevent current user data from getting out of sync with user store
      case 'USER_DATA': {
        const user = this.getUser();
        if (user && user.get('id') === action.user.id) {
          const newUser = user.merge(action.user);
          const session = this.currentSession();
          node.set(session.merge({ user: newUser }));
        }
        return;
      }

      // Prevent current org data from getting out of sync with org store
      case 'ORGANIZATION_DATA': {
        const org = this.getOrg();
        if (org && org.get('id') === action.organization.id) {
          const session = this.currentSession();
          node.set(
            session.merge({ organization: org.merge(action.organization) })
          );
        }
        break;
      }

      default:
    }
  },

  isLoaded() {
    return !this.currentSession().isEmpty();
  },

  currentSession() {
    return node.get();
  },

  getUser(field) {
    if (!this.isLoaded()) return undefined;

    if (field != undefined) {
      return this.currentSession().getIn(['user', field]);
    } else {
      return this.currentSession().get('user');
    }
  },

  getOrg() {
    if (!this.isLoaded()) return undefined;
    return this.currentSession().get('organization');
  },

  isTestAccount() {
    if (!this.isLoaded()) return undefined;
    const org = this.getOrg();

    return org && org.get('test_account');
  },

  hasFeature(feature) {
    if (!this.isLoaded()) return undefined;
    return this.currentSession().getIn(['feature', feature]);
  },

  hasFeatureInUser(feature) {
    if (!this.isLoaded()) return undefined;
    const userFeatureGroups = this.currentSession().getIn(['user', 'feature_groups']);
    return userFeatureGroups && userFeatureGroups.includes(feature);
  },

  hasFeatureInOrgAndUser(feature) {
    return this.hasFeature(feature) && this.hasFeatureInUser(feature);
  },

  isDeveloper() {
    if (!this.isLoaded()) return undefined;
    return this.getUser().get('is_developer');
  },

  isMasquerading() {
    if (!this.isLoaded()) return undefined;
    return this.currentSession().get('masquerading');
  },

  isAdmin() {
    if (!this.isLoaded()) return undefined;
    return this.currentSession().getIn(['user', 'system_admin']);
  },

  // Answers: Is the current user an admin of the current org?
  isOrgAdmin() {
    if (this.isAdmin()) {
      return false;
    } else if (this.isLoaded()) {
      return AcsControls.isFeatureEnabled(FeatureConstants.ADMINISTRATION);
    } else {
      return undefined;
    }
  },

  isOrgOwner() {
    if (this.isAdmin()) {
      return false;
    } else if (this.isLoaded()) {
      const user = this.getUser();
      const org = this.getOrg();
      return org.get('owner_id') === user.get('id');
    } else {
      return undefined;
    }
  },

  canViewBilling() {
    return this.isAdmin() || this.isOrgAdmin();
  },

  // You can admin the current org if one of the following is true
  //  1. you are a system administrator
  //  2. you are a collaborator of the org with admin access
  //  3. you are the owner of the org
  canAdminCurrentOrg() {
    if (!this.isLoaded()) return undefined;

    return this.isAdmin() || AcsControls.isFeatureEnabled(FeatureConstants.ADMINISTRATION);
  },

  canAdminCustomerOrg() {
    return  FeatureStore.hasPlatformFeature(FeatureConstants.MANAGE_ORGS_GLOBAL);
  },

  isRecordWithinCurrOrg(record) {
    const currOrg = this.getOrg();
    if (currOrg && record) {
      return currOrg.get('id') === record.get('organization_id');
    }
    return false;
  },

  isCustomerAdmin(customerOrgId) {
    if (this.isAdmin()) {
      return false;
    } else if (this.isLoaded()) {
      return AcsControls.isFeatureEnabled(FeatureConstants.ADMINISTRATION) && this.getOrg().get('id') == customerOrgId;
    } else {
      return undefined;
    }
  }
};

Dispatcher.register(SessionStore.act.bind(SessionStore));

export default SessionStore;
