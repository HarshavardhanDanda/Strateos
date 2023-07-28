import Dispatcher from 'main/dispatcher';
import _          from 'lodash';
import HTTPUtil   from 'main/util/HTTPUtil';
import ajax       from 'main/util/ajax';
import Urls       from 'main/util/urls';

const AccessControlActions = {
  loadUser_acl() {
    return HTTPUtil.get(Urls.user_acl())
      .done(data => {
        Dispatcher.dispatch({ type: 'FEATURE_APPLICATION_LIST', apps: _.keys(data.applications) });
        Dispatcher.dispatch({ type: 'FEATURE_LIST', features: _.concat(..._.values(data.applications)) });
        Dispatcher.dispatch({ type: 'USER_ACL', user_acl: data });
      });
  },

  loadFeatureGroups() {
    return HTTPUtil.get(Urls.features())
      .done(response => Dispatcher.dispatch({ type: 'FEATURE_GROUP_LIST', featureGroups: response.content }));
  },

  loadFeatureGroupsByOrgId(orgId) {
    const url = `${Urls.features()}?organization_id=${orgId}`;
    return ajax.get(url)
      .done(response => Dispatcher.dispatch({ type: 'FEATURE_GROUP_LIST', featureGroups: response.content }));
  },

  loadPermissions({ userIds, featureCode, contextIds }) {
    return ajax
      .post(Urls.permission_summary(), { userIds, featureCode, contextIds })
      .done((response) =>
        Dispatcher.dispatch({
          type: 'PERMISSION_SUMMARY_LIST',
          permissionSummary: response
        })
      );
  },

  loadPermissionsByOrg({ userIds, featureCode, organizationId }) {
    return ajax
      .get(Urls.permission_summary_by_org(), { userIds, featureCode, organizationId })
      .done((response) =>
        Dispatcher.dispatch({
          type: 'PERMISSION_SUMMARY_LIST',
          permissionSummary: response
        })
      );
  }
};

export default AccessControlActions;
