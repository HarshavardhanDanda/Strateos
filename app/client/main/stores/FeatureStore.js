import Dispatcher from 'main/dispatcher';
import * as Immutable from 'immutable';
import rootNode from 'main/state/rootNode';
import FeatureConstants from '@strateos/features';
import AcsControls from 'main/util/AcsControls';
import _ from 'lodash';

const appNode = rootNode.sub('apps', Immutable.Map());
const featureNode = rootNode.sub('features', Immutable.Map());
const featureGroupNode = rootNode.sub('feature-groups', Immutable.Map());
const permissionSummary = rootNode.sub('permission-summary', Immutable.Map());
const acsFeatures = rootNode.sub('user-acl', Immutable.Map());

const FeatureStore = {
  act(action) {
    switch (action.type) {
      case 'FEATURE_APPLICATION_LIST':
        return appNode.set(Immutable.fromJS(action.apps));
      case 'FEATURE_LIST':
        return featureNode.set(Immutable.fromJS(action.features));
      case 'FEATURE_GROUP_LIST':
        return featureGroupNode.set(Immutable.fromJS(action.featureGroups));
      case 'USER_ACL':
        return acsFeatures.set(Immutable.fromJS(action.user_acl));
      case 'PERMISSION_SUMMARY_LIST':
        return permissionSummary.set(Immutable.fromJS(action.permissionSummary));
      default:
        return undefined;
    }
  },

  hasApp(application) {
    return appNode.get().contains(application);
  },

  hasFeature(feature) {
    return featureNode.get().contains(feature);
  },

  getFeatureGroups() {
    return featureGroupNode.get();
  },

  getUserPermissions() {
    return permissionSummary.get();
  },

  getUserPermissionByIds(userIds) {
    return permissionSummary.get()
      .filter(u => _.includes(userIds, u.get('userId')))
      .toList();
  },

  getUserPermission(userId) {
    return permissionSummary.get()
      .filter(u => u.get('userId') === userId)
      .toList();
  },

  getACSPermissions() {
    return _.extend({}, acsFeatures.get().toJS(), AcsControls);
  },

  canManageRunState(labId) {
    const labPermissions = acsFeatures.get().get('lab_ctx_permissions', []);
    if (labId === 'all') {
      return labPermissions.length > 0 && labPermissions.every(lab => lab.get('features').contains(FeatureConstants.RUN_STATE_MGMT));
    } else {
      const specificLab = labPermissions.find(lab => lab.get('labId') === labId);
      return specificLab != undefined && specificLab.get('features').contains(FeatureConstants.RUN_STATE_MGMT);
    }
  },

  canRegisterCompound() {
    return this.hasFeature(FeatureConstants.REGISTER_COMPOUND) ||
      this.hasFeature(FeatureConstants.REGISTER_PUBLIC_COMPOUND);
  },

  hasLabPermissions() {
    const labPermissions = acsFeatures.get().get('lab_ctx_permissions');
    return labPermissions && labPermissions.size;
  },

  getLabIds() {
    const labPermissions = acsFeatures.get().get('lab_ctx_permissions');
    return labPermissions.map(lab => lab.get('labId'));
  },

  getLabIdsWithFeatures(features) {
    return acsFeatures.get()
      .get('lab_ctx_permissions', Immutable.List())
      .filter(lab => lab.get('features').includes(features))
      .map(lab => lab.get('labId'));
  },

  hasFeatureInLab(feature, labId) {
    let labPermissions = acsFeatures.get().get('lab_ctx_permissions');

    if (labPermissions) {
      labPermissions = labPermissions.filter(lab => lab.get('labId') === labId && lab.get('features').includes(feature));
      return labPermissions.size;
    }
    return false;
  },

  hasPlatformFeature(feature) {
    const platformPermissions = acsFeatures.get().get('platform_ctx_permissions');
    if (platformPermissions) {
      return platformPermissions.includes(feature);
    }
    return false;
  }
};

Dispatcher.register(FeatureStore.act.bind(FeatureStore));

export default FeatureStore;
