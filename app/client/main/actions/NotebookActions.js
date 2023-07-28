/* eslint-disable camelcase */
import Dispatcher          from 'main/dispatcher';
import HTTPUtil            from 'main/util/HTTPUtil';
import ajax                from 'main/util/ajax';
import NotificationActions from 'main/actions/NotificationActions';
import Urls                from 'main/util/urls';

const NotebookActions = {
  load(project_id, id, options) {
    return HTTPUtil.get(Urls.notebook(project_id, id), { options })
      .done(notebook => Dispatcher.dispatch({ type: 'NOTEBOOK_DATA', notebook }));
  },

  loadAll(project_id) {
    return ajax.get(Urls.notebooks(project_id))
      .done(notebooks => Dispatcher.dispatch({ type: 'NOTEBOOK_LIST', notebooks }))
      .fail((...response) => NotificationActions.handleError(...response));
  },

  create(project_id) {
    return ajax.post(Urls.notebooks(project_id), {
      notebook: {
        content: {
          nbformat_minor: 0,
          cells: [],
          nbformat: 4,
          metadata: {}
        }
      }
    })
      .done(notebook => Dispatcher.dispatch({ type: 'NOTEBOOK_DATA', notebook }))
      .fail((xhr, status, text) => {
        alert(text);
      });
  },

  update(project_id, id, updates) {
    return ajax.put(Urls.notebook(project_id, id), updates)
      .done(notebook => Dispatcher.dispatch({ type: 'NOTEBOOK_DATA', notebook }))
      .fail((err) => {
        this.load(project_id, id);
        NotificationActions.handleError(err);
      });
  },

  destroy(project_id, id) {
    return ajax.delete(Urls.notebook(project_id, id))
      .done(() => {
        Dispatcher.dispatch({ type: 'NOTEBOOK_DESTROYED', id });
      })
      .fail((xhr, status, text) => {
        alert(text);
      });
  },

  fork(project_id, notebook_id) {
    return ajax.post(Urls.fork_notebook(project_id, notebook_id))
      .done(notebook => Dispatcher.dispatch({ type: 'NOTEBOOK_DATA', notebook }))
      .fail((xhr, status, text) => {
        alert(text);
      });
  }
};

export default NotebookActions;
