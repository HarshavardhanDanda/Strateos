/* eslint-disable camelcase */
import Dispatcher          from 'main/dispatcher';
import HTTPUtil            from 'main/util/HTTPUtil';
import ajax                from 'main/util/ajax';
import NotificationActions from 'main/actions/NotificationActions';
import Urls                from 'main/util/urls';

const ReleaseActions = {
  loadAllForPackage(package_id, options) {
    return HTTPUtil.get(Urls.releases_for_package(package_id), { options })
      .done(releases => Dispatcher.dispatch({ type: 'RELEASE_LIST', releases }));
  },

  load(package_id, release_id, options) {
    return HTTPUtil.get(Urls.release(package_id, release_id), { options })
      .done(release => Dispatcher.dispatch({ type: 'RELEASE_DATA', release }));
  },

  loadShortJson(package_id, release_id, options) {
    const data = { short_json: true };

    return HTTPUtil.get(Urls.release(package_id, release_id), { data, options })
      .done(release => Dispatcher.dispatch({ type: 'RELEASE_DATA', release }));
  },

  publish(package_id, release_id) {
    return ajax.post(Urls.publish_release(package_id, release_id))
      .done(({ release, protocols }) => {
        Dispatcher.dispatch({
          type: 'RELEASE_DATA',
          release
        });
        Dispatcher.dispatch({
          type: 'PROTOCOL_LIST',
          protocols
        });
      })
      .fail((...response) => NotificationActions.handleError(...response));
  },

  retract(package_id, release_id) {
    return ajax.post(Urls.retract_release(package_id, release_id))
      .done(({ release, protocols }) => {
        Dispatcher.dispatch({
          type: 'RELEASE_DATA',
          release
        });
        Dispatcher.dispatch({
          type: 'PROTOCOL_LIST',
          protocols
        });
      })
      .fail((...response) => NotificationActions.handleError(...response));
  },

  delete(package_id, release_id) {
    return ajax.delete(Urls.release(package_id, release_id))
      .fail((...response) => NotificationActions.handleError(...response));
  },

  validate(packageId, upload_id, userId) {
    return ajax.post(Urls.releases(packageId), { release: { upload_id: upload_id, user_id: userId } })
      .done(release => Dispatcher.dispatch({ type: 'RELEASE_DATA', release }))
      .fail((...response) => NotificationActions.handleError(...response));
  }
};

export default ReleaseActions;
