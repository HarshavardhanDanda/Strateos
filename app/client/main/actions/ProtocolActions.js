import Dispatcher          from 'main/dispatcher';
import HTTPUtil            from 'main/util/HTTPUtil';
import ajax                from 'main/util/ajax';
import NotificationActions from 'main/actions/NotificationActions';
import Urls                from 'main/util/urls';

const ProtocolActions = {
  loadList(options = {}) {
    // do not include all of the protocol fields.
    const data = {
      browser_modal: true,
      ...options
    };

    return ajax.get(Urls.all_protocols(), data)
      .done(protocols => Dispatcher.dispatch({ type: 'PROTOCOL_LIST', protocols }));
  },

  loadPackageProtocols(packageId, name, latestOnly, options) {
    const data = {};
    if (name) { data.name = name; }
    if (latestOnly) { data.latest = true; }

    return HTTPUtil.get(Urls.all_protocols_for_package(packageId), { data, options })
      .done(protocols => Dispatcher.dispatch({ type: 'PROTOCOL_LIST', protocols }));
  },

  loadReleaseProtocols(releaseId, options) {
    const data = { release_id: releaseId };

    return HTTPUtil.get(Urls.protocols_for_release(), { data, options })
      .done((protocols) => {
        Dispatcher.dispatch({ type: 'PROTOCOL_LIST', protocols });
      });
  },

  loadProjectProtocols(projectId, browserModal) {
    const data = { project_id: projectId, browser_modal: browserModal };

    return ajax.get(Urls.protocols_for_project(), data)
      .done((protocols) => {
        Dispatcher.dispatch({ type: 'PROTOCOL_LIST', protocols });
      });
  },

  load(id, options) {
    return HTTPUtil.get(Urls.protocol(id), { options })
      .done(protocol => Dispatcher.dispatch({ type: 'PROTOCOL_DATA', protocol }));
  },

  retract(id) {
    return ajax.post(Urls.retract_protocol(id))
      .done(protocol => Dispatcher.dispatch({ type: 'PROTOCOL_DATA', protocol }))
      .fail((...response) => NotificationActions.handleError(...response));
  },

  publish(id) {
    return ajax.post(Urls.publish_protocol(id))
      .done(protocol => Dispatcher.dispatch({ type: 'PROTOCOL_DATA', protocol }))
      .fail((...response) => NotificationActions.handleError(...response));
  }
};

export default ProtocolActions;
