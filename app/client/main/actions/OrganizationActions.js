import Dispatcher from 'main/dispatcher';
import HTTPUtil   from 'main/util/HTTPUtil';
import ajax       from 'main/util/ajax';
import Urls       from 'main/util/urls';
import NotificationActions from 'main/actions/NotificationActions';
import JsonAPIIngestor from 'main/api/JsonAPIIngestor';

const OrganizationActions = {

  load(id, options) {
    return HTTPUtil.get(Urls.organization(id), { options })
      .done(organization => Dispatcher.dispatch({ type: 'ORGANIZATION_DATA', organization }));
  },

  loadOrganization(id, options) {
    return HTTPUtil.get(Urls.all_organizations(id), { options })
      .then(payload => JsonAPIIngestor.ingest(payload));
  },

  loadBySubdomain(subdomain, options) {
    return HTTPUtil.get(Urls.use(subdomain).organization(), { options })
      .done(organization => Dispatcher.dispatch({ type: 'ORGANIZATION_DATA', organization }));
  },

  loadAllForCurrentUser(options) {
    return HTTPUtil.get(Urls.organizations(), { data: { flat_json: true }, options })
      .done(organizations => Dispatcher.dispatch({ type: 'ORGANIZATION_LIST', organizations }));
  },

  loadCustomers(page, perPage, options) {
    const q = options.search || '*';

    return ajax.get(Urls.organization_search_api(), {
      q,
      page,
      per_page: perPage,
      order_by: options.orderBy,
      direction: options.direction,
      customers_without_implementation: options.customers_without_implementation || undefined,
    })
      .done((response) => {
        const results = response.data.map((org) => ({ id: org.id, ...org.attributes }));
        Dispatcher.dispatch({ type: 'ORGANIZATION_SEARCH_RESULTS', results });
      })
      .fail((...response) => NotificationActions.handleError(...response));
  },

  update(id, data, subdomain = undefined) {
    const url = subdomain ? Urls.update_organization(subdomain, id) : Urls.organization(id);
    return ajax.put(url, { organization: data })
      .done((organization) => {
        Dispatcher.dispatch({ type: 'ORGANIZATION_DATA', organization });
      })
      .fail((...response) => NotificationActions.handleError(...response));
  },

  add(organizations) {
    Dispatcher.dispatch({ type: 'ORGANIZATIONS_API_LIST', entities: organizations });
  }
};

export default OrganizationActions;
