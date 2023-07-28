import Dispatcher          from 'main/dispatcher';
import HTTPUtil            from 'main/util/HTTPUtil';
import NotificationActions from 'main/actions/NotificationActions';
import Urls                from 'main/util/urls';
import InvoiceAPI from 'main/api/InvoiceAPI';
import _ from 'lodash';
import rootNode from 'main/state/rootNode';
import Immutable  from 'immutable';
import ajax from 'main/util/ajax';

const InvoiceActions = {
  fetchXeroReconcileData(date) {
    return ajax.get(`${Urls.xero_reconcile()}?date=${date}`);
  },

  loadAll(options) {
    return HTTPUtil.get(Urls.invoices(), { options })
      .done((data) => {
        Dispatcher.dispatch({ type: 'INVOICE_LIST', invoices: data });
      })
      .fail((...response) => NotificationActions.handleError(...response));
  },

  loadByOrg(subdomain, orgId, options) {
    return HTTPUtil.get(Urls.get_invoices(subdomain, orgId), { options })
      .done((data) => {
        Dispatcher.dispatch({ type: 'INVOICE_LIST', invoices: data });
      })
      .fail((...response) => NotificationActions.handleError(...response));
  },
  fetchPastInvoices() {
    InvoiceAPI.indexAll({ filters: { finalized: true, test_org: false, charged: true },
      version: 'v1',
      limit: 100,
      includes: ['payment_method', 'organization'],
      fields: { organizations: ['id', 'name', 'subdomain'] }
    })
      .done(response => {
        const data = _.map(response, 'data');
        const invoices = data.flat();
        rootNode.setIn('pastInvoices', Immutable.fromJS(invoices));
      })
      .fail((...response) => NotificationActions.handleError(...response));
  },

  fetchPendingInvoices() {
    InvoiceAPI.indexAll({ filters: { test_org: false, remitted: false, forgiven: false },
      version: 'v1',
      limit: 48,
      includes: ['payment_method', 'organization'],
      fields: { organizations: ['id', 'name', 'subdomain'] },
    })
      .done(response => {
        const data = _.map(response, 'data').flat().map(invoice =>  ({ id: invoice.id, ...invoice.attributes }));
        Dispatcher.dispatch({
          type: 'UNPAID_INVOICE_LIST',
          invoices: data
        });
      })
      .fail((...response) => NotificationActions.handleError(...response));
  },

  fetchBadInvoices() {
    InvoiceAPI.indexAll({ filters: { finalized: true, test_org: false, forgiven: true },
      includes: ['payment_method', 'organization'],
      fields: { organizations: ['id', 'name', 'subdomain'] },
      version: 'v1',
      limit: 48,
    })
      .done(response => {
        const data = _.map(response, 'data').flat();
        rootNode.setIn('badInvoices', Immutable.fromJS(data));
      })
      .fail((...response) => NotificationActions.handleError(...response));
  },

  fetchDelayedInvoices() {
    InvoiceAPI.indexAll({ filters: { finalized: true, test_org: false, delay_period: 15 },
      includes: ['payment_method', 'organization'],
      fields: { organizations: ['id', 'name', 'subdomain'] },
      version: 'v1',
      limit: 48,
    })
      .done(response => {
        const data = _.map(response, 'data').flat();
        rootNode.setIn('delayedInvoices', Immutable.fromJS(data));
      })
      .fail((...response) => NotificationActions.handleError(...response));
  },

  fetchInvoices(options) {
    const finalOptions = {
      version: 'v1',
      ...options
    };

    return InvoiceAPI.indexAll(finalOptions)
      .fail((...response) => NotificationActions.handleError(...response));
  },

  create(attributes) {
    return InvoiceAPI.create({ attributes }, { version: 'v1' })
      .done(() => {
        NotificationActions.createNotification({
          text: 'Created Invoice'
        });
      }).fail((...response) => NotificationActions.handleError(...response));
  }
};

export default InvoiceActions;
