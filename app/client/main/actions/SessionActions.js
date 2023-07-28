import Dispatcher from 'main/dispatcher';
import HTTPUtil from 'main/util/HTTPUtil';
import Urls from 'main/util/urls';

const SessionActions = {
  load(options) {
    const data = { subdomain: this.getSubdomain() };

    return HTTPUtil.get(Urls.sessions(), { data, options }).done(session =>
      Dispatcher.dispatch({ type: 'SESSION_DATA', session })
    );
  },

  // TODO: This should not be here. Perhaps Session Store makes more sense?
  getSubdomain() {
    return window.location.pathname.split('/')[1];
  }
};

export default SessionActions;
