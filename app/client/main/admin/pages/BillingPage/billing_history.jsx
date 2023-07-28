import Accounting from 'accounting';
import Immutable  from 'immutable';
import Moment     from 'moment';
import PropTypes  from 'prop-types';
import React      from 'react';

import ModalActions          from 'main/actions/ModalActions';
import { Table,  Column, DateTime }    from '@transcriptic/amino';
import { Loading } from 'main/components/page';
import ConnectToStores       from 'main/containers/ConnectToStoresHOC';
import rootNode              from 'main/state/rootNode';
import ajax                  from 'main/util/ajax';
import Urls                  from 'main/util/urls';
import XeroReconciliationModal from 'main/admin/pages/BillingPage/XeroReconciliationModal';

const UpcomingChargeActions = {
  initialize() {
    ajax
      .get('/admin/billing/past_invoices')
      .done(data => rootNode.setIn('pastInvoices', Immutable.fromJS(data)));
  }
};

function Organization(inv) {
  const org = inv.get('organization');

  return (
    <a href={Urls.use(org.get('subdomain')).organization()}>
      {org.get('name')}
    </a>
  );
}

function CreatedDate(inv) {
  return (
    <Choose>
      <When condition={inv.get('created_at') != undefined}>
        <DateTime timestamp={inv.get('created_at')} />
      </When>
      <Otherwise>—</Otherwise>
    </Choose>
  );
}

function ChargedDate(inv) {
  return (
    <Choose>
      <When condition={inv.get('charged_at') != undefined}>
        <DateTime timestamp={inv.get('charged_at')} />
      </When>
      <Otherwise>—</Otherwise>
    </Choose>
  );
}

function ForgivenDate(inv) {
  return (
    <Choose>
      <When condition={inv.get('forgiven_at') != undefined}>
        <DateTime timestamp={inv.get('forgiven_at')} />
      </When>
      <Otherwise>—</Otherwise>
    </Choose>
  );
}

function PaymentMethod(inv) {
  const pm = inv.get('payment_method');

  return (
    <span>
      <Choose>
        <When condition={pm && pm.get('type') === 'CreditCard'}>
          <i className="fa fa-credit-card fa-fw" />
        </When>
        <When condition={pm && pm.get('type') === 'PurchaseOrder'}>
          <i className="far fa-file fa-fw" />
        </When>
        <Otherwise><i className="far fa-question-circle fa-fw" /></Otherwise>
      </Choose>
      {' '}
      <Choose>
        <When condition={pm && pm.get('type') === 'PurchaseOrder'}>
          {`PO: ${pm.get('po_reference_number')}`}
        </When>
        <Otherwise>
          {inv.getIn(['payment_method', 'description'])}
        </Otherwise>
      </Choose>
    </span>
  );
}

function InvoiceID(inv) {
  const comp = (
    <a
      href={`https://go.xero.com/AccountsReceivable/View.aspx?invoiceID=${inv.get('xero_invoice_guid')}`}
      target="_new"
    >
      {inv.get('xero_invoice_number')}
    </a>
  );

  return comp;
}

function Contact(inv) {
  return `${inv.getIn(['contact_user', 'name'])} <${inv.getIn(['contact_user', 'email'])}>`;
}

function Total(inv) {
  return Accounting.formatMoney(inv.get('total'));
}

function FooterOrganization() {
  return 'Total';
}

function reconcileModalId(month) {
  return `${XeroReconciliationModal.MODAL_ID}_${month}`;
}

function xeroReconcileData(date) {
  return ajax.get(`/admin/billing/xero_reconcile?date=${date}`);
}

function FooterCreatedDate({ month }) {
  return (
    <span>
      <a onClick={() => ModalActions.open(reconcileModalId(month))}>
        Reconcile with Xero
      </a>
      <XeroReconciliationModal modalId={reconcileModalId(month)} date={month} dataFetch={xeroReconcileData} />
    </span>
  );
}

FooterCreatedDate.propTypes = {
  month: PropTypes.number
};

function FooterChargedDate({ group }) {
  const amount = group
    .filter(m => m.get('charged_at') != undefined)
    .map(m => m.get('total'))
    .reduce((m, o) => parseFloat(m) + parseFloat(o));

  return Accounting.formatMoney(amount);
}

class BillingHistory extends React.Component {

  static get propTypes() {
    return {
      pastInvoices: PropTypes.instanceOf(Immutable.Iterable)
    };
  }

  componentDidMount() {
    UpcomingChargeActions.initialize();
  }

  render() {
    return (
      <div className="billing-history">
        <Choose>
          <When condition={this.props.pastInvoices}>
            {this.props.pastInvoices
              .groupBy((ch) => {
                return Moment(ch.get('charged_at')).format('YYYY-MM-01');
              })
              .sortBy((group, month) => month)
              .reverse()
              .map((group, month) => {
                return (
                  <Table
                    key={month}
                    loaded
                    disabledSelection
                    id={month}
                    data={group.sortBy(inv => inv.get('xero_invoice_number')).reverse()}
                  >
                    <Column
                      renderCellContent={Organization}
                      header="Organization"
                      id="organization-column"
                      footer={FooterOrganization}
                    />
                    <Column
                      renderCellContent={CreatedDate}
                      header="Created Date"
                      id="created-date-column"
                      footer={() => FooterCreatedDate({ month })}
                    />
                    <Column
                      renderCellContent={ChargedDate}
                      header="Charged Date"
                      id="charged-date-column"
                      footer={() => FooterChargedDate({ group })}
                    />
                    <Column renderCellContent={ForgivenDate} header="Forgiven Date" id="forgiven-date-column" />
                    <Column renderCellContent={PaymentMethod} header="Payment Method" id="payment-method-column" />
                    <Column renderCellContent={InvoiceID} header="Invoice ID" id="invoice-id-column" />
                    <Column renderCellContent={Contact} header="Contact" id="contact-column" />
                    <Column renderCellContent={Total} header="Total" id="total-column" style={{ textAlign: 'right' }} />
                  </Table>
                );
              })}
          </When>
          <Otherwise><Loading /></Otherwise>
        </Choose>
      </div>
    );
  }
}

const getStateFromStores = function() {
  const pastInvoices = rootNode.get('pastInvoices');

  return {
    pastInvoices
  };
};

export default ConnectToStores(BillingHistory, getStateFromStores);
export { BillingHistory as BillingHistoryTable };
