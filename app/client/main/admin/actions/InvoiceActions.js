import Dispatcher from 'main/dispatcher';
import AdminUrls from 'main/admin/urls';
import Urls from 'main/util/urls';
import ajax from 'main/util/ajax';

const InvoiceActions = {
  applyCredit(invoiceId, creditId, subdomain) {
    const url  = subdomain ? Urls.apply_credit_to_invoice(subdomain, invoiceId)
      : AdminUrls.apply_credit_to_invoice(invoiceId);
    const data = { credit_id: creditId };

    return ajax
      .post(url, data)
      .done(({ credit, invoice }) => {
        Dispatcher.dispatch({ type: 'INVOICE_LIST', invoices: [invoice] });
        Dispatcher.dispatch({ type: 'CREDIT_LIST', credits: [credit] });
      });
  }
};

export default InvoiceActions;
