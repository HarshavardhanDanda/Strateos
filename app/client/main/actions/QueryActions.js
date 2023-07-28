import Dispatcher from 'main/dispatcher';
import HTTPUtil   from 'main/util/HTTPUtil';
import Urls       from 'main/util/urls';
import ajax       from 'main/util/ajax';

const QueryActions = {
  loadAll(projectId) {
    return ajax.get(Urls.queries(projectId))
      .done(queries => Dispatcher.dispatch({ type: 'QUERY_LIST', queries }));
  },

  execute(projectId, id, options) {
    return HTTPUtil.get(Urls.query(projectId, id), { options })
      .done((results) => {
        Dispatcher.dispatch({ type: 'QUERY_RESULTS', results });
      });
  }
};

export default QueryActions;
