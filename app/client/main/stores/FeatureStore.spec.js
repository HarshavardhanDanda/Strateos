import { expect } from 'chai';
import Immutable from 'immutable';
import FeatureConstants from '@strateos/features';
import Dispatcher from 'main/dispatcher';
import FeatureStore from './FeatureStore';

describe('FeatureStore', () => {
  it('should return true for MANAGE_ORGS_GLOBAL when permission is present', () => {
    const permissions = Immutable.fromJS({
      platform_ctx_permissions: ['MANAGE_ORGS_GLOBAL']
    });
    Dispatcher.dispatch({ type: 'USER_ACL', user_acl: permissions });
    expect(FeatureStore.hasPlatformFeature(FeatureConstants.MANAGE_ORGS_GLOBAL)).to.be.true;
    expect(FeatureStore.hasPlatformFeature(FeatureConstants.CREATE_DELETE_ORGANIZATION)).to.be.false;
  });

  it('should return true for CREATE_DELETE_ORGANIZATION when permission is present', () => {
    const permissions = Immutable.fromJS({
      platform_ctx_permissions: ['MANAGE_ORGS_GLOBAL', 'CREATE_DELETE_ORGANIZATION']
    });
    Dispatcher.dispatch({ type: 'USER_ACL', user_acl: permissions });
    expect(FeatureStore.hasPlatformFeature(FeatureConstants.CREATE_DELETE_ORGANIZATION)).to.be.true;
    expect(FeatureStore.hasPlatformFeature(FeatureConstants.MANAGE_ORGS_GLOBAL)).to.be.true;
  });
});
