import Dispatcher          from 'main/dispatcher';
import HTTPUtil            from 'main/util/HTTPUtil';
import ajax                from 'main/util/ajax';
import NotificationActions from 'main/actions/NotificationActions';
import Urls                from 'main/util/urls';

const PackageActions = {

  loadAll(options) {
    return HTTPUtil.get(Urls.packages(), { options })
      .done(packages => Dispatcher.dispatch({ type: 'PACKAGES_LIST', packages }));
  },

  load(id, options) {
    return HTTPUtil.get(Urls.package(id), { options })
      .done(_package => Dispatcher.dispatch({ type: 'PACKAGE_DATA', _package }));
  },

  loadShortJson(id, options) {
    const data = { short_json: true };

    return HTTPUtil.get(Urls.package(id), { data, options })
      .done(_package => Dispatcher.dispatch({ type: 'PACKAGE_DATA', _package }));
  },

  create(packageInfo) {
    return ajax.post(Urls.packages(), packageInfo)
      .done(_package =>
        Dispatcher.dispatch({
          type: 'PACKAGE_DATA',
          _package
        }))
      .fail((...response) => NotificationActions.handleError(...response));
  },

  changePrivacy({ id, makePublic }) {
    return ajax.put(Urls.package(id), { package: { public: makePublic } })
      .done(_package =>
        Dispatcher.dispatch({
          type: 'PACKAGE_DATA',
          _package
        }))
      .fail((...response) => NotificationActions.handleError(...response));
  },

  delete(id) {
    return ajax.delete(Urls.package(id))
      .done(() => { window.location = Urls.packages(); })
      .fail((...response) => NotificationActions.handleError(...response));
  }
};

export default PackageActions;
