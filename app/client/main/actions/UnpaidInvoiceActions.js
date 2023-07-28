import Dispatcher          from 'main/dispatcher';
import ajax                from 'main/util/ajax';
import NotificationActions from 'main/actions/NotificationActions';
import Urls from 'main/util/urls';
import InvoiceAPI from 'main/api/InvoiceAPI';

import _ from 'lodash';
import JsonAPIIngestor from 'main/api/JsonAPIIngestor';

const sequentially = (fns) => {
  let initial;
  const promise = fns.reduce((m, o) => m.then(o), (initial = ajax.Deferred()));
  initial.resolve();
  return promise;
};

const UnpaidInvoiceActions = {

  select(id, selected) {
    Dispatcher.dispatch({
      type: 'UNPAID_INVOICE_SELECT',
      id,
      selected
    });
  },

  selectAll() {
    Dispatcher.dispatch({
      type: 'UNPAID_INVOICE_SELECT_ALL'
    });
  },

  selectNone() {
    Dispatcher.dispatch({
      type: 'UNPAID_INVOICE_SELECT_NONE'
    });
  },

  charge(ids) {
    // Do these one at a time because stripe is slow.
    Dispatcher.dispatch({
      type: 'UNPAID_INVOICE_CHARGING',
      invoice_ids: ids
    });
    const chargedAt = new Date();
    return sequentially(ids.map(id => {
      return InvoiceAPI.update(id, { charged_at: chargedAt }, { version: 'v1' }, {}, 'PATCH'
      ).done((response) => {
        const invoice = {
          id: response.data.id,
          ...response.data.attributes,
          charge_in_progress: false
        };
        Dispatcher.dispatch({
          type: 'UNPAID_INVOICE_LIST',
          invoices: [invoice]
        });
        Dispatcher.dispatch({
          type: 'INVOICE_LIST',
          invoices: [invoice]
        });
        NotificationActions.createNotification({
          text: 'Charged Invoices'
        });
      }).fail((...response) => {
        NotificationActions.handleError(...response);
        Dispatcher.dispatch({
          type: 'UNPAID_INVOICE_CHARGE_FAILED',
          id
        });
      });
    }));
  },

  forgive(ids) {
    const forgivenAt = new Date();
    const promises = ids.map((id) => {
      return InvoiceAPI.update(id, { forgiven_at: forgivenAt }, { version: 'v1' }, {}, 'PATCH')
        .done((response) => {
          Dispatcher.dispatch({
            type: 'UNPAID_INVOICE_LIST',
            invoices: [{ id: response.data.id, ...response.data.attributes }]
          });
          NotificationActions.createNotification({
            text: 'Invoice is forgiven successfully'
          });
        });
    });
    return ajax.when(...promises);
  },

  remit(ids) {
    const remittedAt = new Date();
    const promises = ids.map((id) => {
      return InvoiceAPI.update(id, { remitted_at: remittedAt }, { version: 'v1' }, {}, 'PATCH')
        .done((response) => {
          Dispatcher.dispatch({
            type: 'UNPAID_INVOICE_LIST',
            invoices: [{ id: response.data.id, ...response.data.attributes }]
          });
          NotificationActions.createNotification({
            text: 'Invoice is remitted successfully'
          });
        });
    });
    return ajax.when(...promises);
  },

  createNetsuiteInvoice(invoiceId) {
    return ajax
      .post(Urls.generate_netsuite_invoice(invoiceId))
      .done(response => {
        const data = JsonAPIIngestor.ingest(response);
        Dispatcher.dispatch({ type: 'UNPAID_INVOICE_LIST', invoices: [data] });
        NotificationActions.createNotification({
          text: 'Created Invoices'
        });
      })
      .fail(err =>
        NotificationActions.handleError(err)
      );
  },

};

export default UnpaidInvoiceActions;
