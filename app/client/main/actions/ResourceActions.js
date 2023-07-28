import _ from 'lodash';

import Dispatcher          from 'main/dispatcher';
import HTTPUtil            from 'main/util/HTTPUtil';
import ajax                from 'main/util/ajax';
import NotificationActions from 'main/actions/NotificationActions';
import Urls                from 'main/util/urls';

const ResourceActions = {
  load(id, options) {
    return HTTPUtil.get(Urls.resource(id), { options })
      .done(response => Dispatcher.dispatch({ type: 'RESOURCE_DATA', resource: response }))
      .fail((...response) => NotificationActions.handleError(...response));
  },

  search(searchOptions, httpOptions) {
    const defaults = {
      page: 1,
      per_page: 6,
      q: '*',
      sort_desc: 'true'
    };

    const options = _.extend(defaults, searchOptions);
    const url = Urls.resources();

    return HTTPUtil.get(url, { data: options, options: httpOptions })
      .done(({ results, num_pages, per_page }) => {

        const dispatchData = _.extend(
          { type: 'RESOURCES_SEARCH_RESULTS' }, options, { results, num_pages, per_page }, { query: options.q }
        );

        Dispatcher.dispatch(dispatchData);
      })
      .fail((...response) => NotificationActions.handleError(...response));
  },

  loadMany(ids) {
    const uniqueIds = _.uniq(ids);

    return HTTPUtil.get(Urls.resource_many(), { data: { ids: uniqueIds } })
      .done(resources => Dispatcher.dispatch({ type: 'RESOURCE_LIST', resources }))
      .fail((...response) => NotificationActions.handleError(...response));
  },

  // optimistic update
  update(resource, updates) {
    const url =  Urls.resource(resource.get('id'));
    const originalResource = resource;
    return ajax.patch(url, { resource: updates })
      .done((data) => Dispatcher.dispatch({ type: 'RESOURCE_DATA', resource: data }))
      .fail((xhr, status, text) => {
        Dispatcher.dispatch({
          type: 'RESOURCE_DATA',
          resource: originalResource.toJS()
        });
        alert(`Failed to create resource: ${text}. ${xhr.responseText}`);
      });
  },

  // optimistic delete
  delete(id) {
    const url =  Urls.resource(id);
    return ajax.delete(url)
      .done(() => {
        Dispatcher.dispatch({
          type: 'RESOURCE_DELETED',
          id
        });
      })
      .fail((...args) => NotificationActions.handleError(...args));
  },

  create(resource) {
    const url =  Urls.resources();
    return ajax.post(url, { resource });
  }
};

export default ResourceActions;
