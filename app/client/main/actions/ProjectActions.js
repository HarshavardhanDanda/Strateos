import _ from 'lodash';

import Dispatcher          from 'main/dispatcher';
import HTTPUtil            from 'main/util/HTTPUtil';
import ajax                from 'main/util/ajax';
import NotificationActions from 'main/actions/NotificationActions';
import Urls                from 'main/util/urls';

const ProjectActions = {
  load(id) {
    return ajax.get(Urls.project(id))
      .done(project => Dispatcher.dispatch({ type: 'PROJECT_DATA', project }));
  },

  loadAll(subdomain) {
    return this.search(subdomain, { per_page: 100000 });
  },

  search(subdomain, searchOptions, httpOptions) {
    const options = _.extend({}, searchOptions);

    if (!options.query) {    options.query = ''; }
    if (!options.per_page) { options.per_page = 10; }
    if (!options.page) {     options.page = 1; }
    if (!options.is_starred) {     options.is_starred = false; }
    if (!options.created_at) {     options.created_at = 'desc'; }

    return HTTPUtil.get(Urls.use(subdomain).projects(), { data: options, options: httpOptions })
      .done(({ results, num_pages, per_page }) => {

        const dispatchData = _.extend(
          { type: 'PROJECTS_SEARCH_RESULTS' }, options, { results, num_pages, per_page }
        );

        Dispatcher.dispatch(dispatchData);
      })
      .fail((...response) => NotificationActions.handleError(...response));
  },

  update(id, updates) {
    return ajax.put(Urls.project(id), { project: updates })
      .done((project) => {
        Dispatcher.dispatch({ type: 'PROJECT_DATA', project });
      })
      .fail((...response) => NotificationActions.handleError(...response));
  },

  transfer(id, organizationId, transferContainers) {
    return ajax.put(Urls.transfer_project(id), { organization_id: organizationId, transfer_containers: transferContainers })
      .done(() => {
        NotificationActions.createNotification({
          text: 'Successfully transfered project.'
        });
      }).fail((...response) => NotificationActions.handleError(...response));
  },

  archive(id) {
    return this.update(id, { archived: true });
  },

  unarchive(id) {
    return this.update(id, { archived: false });
  },

  create(name, payload) {
    return ajax.post(Urls.organization(), { project: { ...payload, name } })
      .done((project) => {
        Dispatcher.dispatch({ type: 'PROJECT_DATA', project });
      })
      .fail((...response) => NotificationActions.handleError(...response));
  },

  destroy(id) {
    return ajax.delete(Urls.project(id))
      .done(() => {
        const project = { id, deleted_at: Date.now() };
        Dispatcher.dispatch({ type: 'PROJECT_DATA', project });
      });
  },

  favorite(project) {
    const is_starred = !project.get('is_favorite');
    return ajax.post(Urls.favorite_project(), { id: project.get('id'), is_starred })
      .done(() => {
        const updatedProject =  project.set('is_favorite', is_starred).toJS();
        Dispatcher.dispatch({ type: 'PROJECT_DATA', project: updatedProject });
      })
      .fail((...response) => NotificationActions.handleError(...response));
  }
};

export default ProjectActions;
