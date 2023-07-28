import Dispatcher          from 'main/dispatcher';
import HTTPUtil            from 'main/util/HTTPUtil';
import NotificationActions from 'main/actions/NotificationActions';
import ajax                from 'main/util/ajax';
import Urls                from 'main/util/urls';

const UserActions = {
  fetchUsers(params) {
    const q = params.search || '*';
    return ajax.get(Urls.users_search_api(), {
      q,
      page: params.page,
      per_page: params.per_page,
      order_by: params.orderBy,
      direction: params.direction,
      is_collaborator: params.is_collaborator
    })
      .done((response) => {
        const results = response.data.map((user) =>  ({ id: user.id, ...user.attributes }));
        Dispatcher.dispatch({ type: 'USER_SEARCH_RESULTS', results });
        const entities = response.included ? response.included.map((org) =>  ({ id: org.id, ...org.attributes })) : [];
        Dispatcher.dispatch({ type: 'ORGANIZATIONS_API_LIST', entities });
      })
      .fail((...response) => NotificationActions.handleError(...response));
  },

  reset2fa(id) {
    return ajax.put(`${Urls.user(id)}/unlock`)
      .fail((...response) => NotificationActions.handleError(...response));
  },

  resetSecondFactorAttemptsCount(id) {
    const promise = ajax.put(Urls.reset_2fa_attempts(id));
    promise.then((user) => {
      Dispatcher.dispatch({
        type: 'USER_DATA',
        user: ajax.camelcase(user)
      });
    }).fail((...response) => NotificationActions.handleError(...response));
    return promise;
  },

  triggerNew2FA(id) {
    const promise = ajax.put(Urls.trigger_new_2fa(id));
    promise.then((user) => {
      Dispatcher.dispatch({
        type: 'USER_DATA',
        user: ajax.camelcase(user)
      });
    }).fail((...response) => NotificationActions.handleError(...response));
    return promise;
  },

  forcePasswordReset(id) {
    const promise = ajax.put(Urls.force_password_reset(id));
    promise.then((user) => {
      Dispatcher.dispatch({
        type: 'USER_DATA',
        user: ajax.camelcase(user)
      });
    }).fail((...response) => NotificationActions.handleError(...response));
    return promise;
  },

  confirm2fa(code) {
    const url = '/2fa_check_code.json';
    const data = { code };

    return ajax.post(url, data);
  },

  loadCurrentUser(options) {
    return HTTPUtil.get(Urls.users_edit(), { options })
      .done(user => Dispatcher.dispatch({ type: 'USER_DATA', user }));
  },

  update(params) {
    return ajax.put(Urls.users(), { user: params })
      .done((user) => {
        NotificationActions.createNotification({ text: 'Account has been successfully updated' });
        Dispatcher.dispatch({ type: 'USER_DATA', user });
      })
      .fail((...response) => NotificationActions.handleError(...response));
  },

  updateUserPreferences(params) {
    return ajax.put(Urls.users(), { ...params, user: {} })
      .done((user) => {
        NotificationActions.createNotification({ text: 'User preferences have been successfully updated' });
        Dispatcher.dispatch({ type: 'USER_DATA', user });
      })
      .fail((...response) => NotificationActions.handleError(...response));
  },

  updateWithoutNotification(params) {
    return ajax.put(Urls.users(), { user: params })
      .done((user) => {
        Dispatcher.dispatch({ type: 'USER_DATA', user });
      });
  },

  requestDeveloperAccess(userId) {
    return ajax.post(Urls.request_developer_access(userId))
      .done((user) => {
        Dispatcher.dispatch({ type: 'USER_DATA', user });
      })
      .fail((...response) => NotificationActions.handleError(...response));
  },

  rotateAPIKey(userId) {
    return ajax.post(Urls.rotate_api_key(userId))
      .done((user) => {
        Dispatcher.dispatch({ type: 'USER_DATA', user });
      })
      .fail((...response) => NotificationActions.handleError(...response));
  },

  signOut() {
    return ajax.delete(Urls.sign_out())
      .then(() => { window.location = '/users/sign_in'; })
      .fail((...response) => NotificationActions.handleError(...response));
  },

  unmasquerade() {
    return ajax.post(Urls.unmasquerade())
      .then(() => { window.location = '/admin'; })
      .fail((...response) => NotificationActions.handleError(...response));
  },

  load(userId, options, json_type = 'collaborator_json') {
    const data = { [json_type]: true };
    return HTTPUtil.get(Urls.user(userId), { data, options })
      .done(user => Dispatcher.dispatch({ type: 'USER_DATA', user }));
  },

  loadUsers(userIds, options) {
    const data = { collaborator_json: true, user_ids: userIds };
    return HTTPUtil.get(Urls.users(), { data, options })
      .done(users =>  {
        Dispatcher.dispatch({ type: 'USERS_API_LIST', entities: users });
      });
  },

  updateProfileImg(id, uploadId) {
    const url = Urls.user_update_profile_img(id);

    const data = {
      upload_id: uploadId
    };

    return ajax.put(url, data)
      .done(user => Dispatcher.dispatch({ type: 'USER_DATA', user }))
      .fail((...response) => NotificationActions.handleError(...response));
  },

  getSchedulerStats() {
    return ajax.get(Urls.scheduler_stats());
  },

  getTopicsOfOrgType(orgType) {
    return HTTPUtil.get(Urls.topics_of_org_type(orgType))
      .done(response => {
        Dispatcher.dispatch({ type: 'TOPIC_OF_ORG_TYPE_LIST', orgTopics: response.content });
      });
  },

  getSubscriptions(orgId, userId) {
    return HTTPUtil.get(Urls.subscriptions(orgId, userId))
      .done(response => {
        Dispatcher.dispatch({ type: 'SUBSCRIPTION_LIST', subscriptions: response.content });
      });
  }
};

export default UserActions;
