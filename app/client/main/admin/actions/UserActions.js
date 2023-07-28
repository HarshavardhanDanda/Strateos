import AdminUrls     from 'main/admin/urls';
import APIActions    from 'main/util/APIActions';
import Dispatcher from 'main/dispatcher';
import ajax from 'main/util/ajax';
import NotificationActions from 'main/actions/NotificationActions';

const resource = 'user';
const url      = AdminUrls.users;

const AdminUserActions = APIActions(resource, url);

const CustomUserActions = {
  resetSecondFactorAttemptsCount(id) {
    const promise = ajax.put(AdminUrls.reset_2fa_attempts(id));
    promise.then((user) => {
      Dispatcher.dispatch({
        type: 'USER_DATA',
        user: ajax.camelcase(user)
      });
    }).fail((...response) => NotificationActions.handleError(...response));
    return promise;
  },

  triggerNew2FA(id) {
    const promise = ajax.put(AdminUrls.trigger_new_2fa(id));
    promise.then((user) => {
      Dispatcher.dispatch({
        type: 'USER_DATA',
        user: ajax.camelcase(user)
      });
    }).fail((...response) => NotificationActions.handleError(...response));
    return promise;
  },

  forcePasswordReset(id) {
    const promise = ajax.put(AdminUrls.force_password_reset(id));
    promise.then((user) => {
      Dispatcher.dispatch({
        type: 'USER_DATA',
        user: ajax.camelcase(user)
      });
    }).fail((...response) => NotificationActions.handleError(...response));
    return promise;
  },

  manageFeatureGroups(id, options) {
    const promise = ajax.put(AdminUrls.manage_feature_groups(id), options);
    promise.then((user) => {
      Dispatcher.dispatch({
        type: 'USER_DATA',
        user: ajax.camelcase(user)
      });
    }).fail((response) => {
      NotificationActions.createNotification({
        text: response.statusText,
        isError: true
      });
    });
    return promise;
  }
};

export default Object.assign(AdminUserActions, CustomUserActions);
