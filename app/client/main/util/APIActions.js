// The intent of this helper is to reduce action boilerplate around
// CRUD and search actions. The benefit being less code, less noise, and
// standardization of common actions.
//
// Request bodies are snake_cased before sending to the server, and response
// bodies are camelCased.
//
// Errors will automatically fire a toaster. Override your desired method if
// you do not want this behavior.
//
// Ideally the snake_casing / camelCasing would occur at the ajax request level,
// but currently this would break some parts of the app.

import underscored from 'underscore.string/underscored';

import ajax                from 'main/util/ajax';
import Dispatcher          from 'main/dispatcher';
import NotificationActions from 'main/actions/NotificationActions';

function APIActions(resource, url) {

  // Dispatches a message composed of the camelCased server responsed
  // with a type of `RESOURCE`_DATA
  const dispatch = (res) => {
    const type     = `${resource}_DATA`.toUpperCase();
    const response = ajax.camelcase(res);
    Dispatcher.dispatch({
      type,
      [resource]: ajax.camelcase(response)
    });
    return response;
  };

  const APICall = (request) => {
    request.then(dispatch)
      .fail((...response) => NotificationActions.handleError(...response));

    return request;
  };

  // Note that the request body is snake_cased
  const create = (data) => {
    const payload = ajax.snakecase(data);
    const request = ajax.post(url(), payload);
    return APICall(request);
  };

  const load = (id) => {
    const request = ajax.get(`${url()}/${id}`);
    return APICall(request);
  };

  // Note that the request body is snake_cased
  const update = (data) => {
    const payload = ajax.snakecase(data);
    const request = ajax.put(`${url()}/${data.id}`, payload);
    return APICall(request);
  };

  const updateMany = (ids, data) => {
    const updates = ids.map(id => update({ id, ...data }));
    return ajax.when(...updates);
  };

  const destroy = (id) => {
    const request = ajax.delete(`${url()}/${id}`);
    return APICall(request);
  };

  // Note that the order_by field is snake_cased and the search results are
  // camelCased
  const search = (page, perPage, options) => {
    const type = `${resource}_SEARCH_RESULTS`.toUpperCase();
    const q = options.search || '*';

    return ajax.get(url(), {
      q,
      page,
      per_page: perPage,
      order_by: underscored(options.orderBy) || undefined,
      direction: options.direction,
      customers_without_implementation: options.customers_without_implementation || undefined
    })
      .then((response) => {
        const data = ajax.camelcase(response);

        Dispatcher.dispatch({
          type,
          results: data.results,
          num_pages: data.numPages,
          per_page: data.perPage,
          query: q
        });

        return {
          results: data.results,
          pagination: {
            page,
            total_pages: data.numPages
          }
        };
      });
  };

  const loadAll = () => search(undefined, undefined, {});

  return {
    create,
    load,
    update,
    updateMany,
    destroy,
    search,
    loadAll
  };
}

export default APIActions;
