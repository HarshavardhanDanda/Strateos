import Accounting from 'accounting';
import Immutable  from 'immutable';
import Moment     from 'moment';
import PropTypes  from 'prop-types';
import React      from 'react';
import { Table,  Column, DateTime, Spinner } from '@transcriptic/amino';
import ConnectToStores from 'main/containers/ConnectToStoresHOC';
import rootNode from 'main/state/rootNode';
import _ from 'lodash';
import BaseTableTypes from 'main/components/BaseTableTypes';
import XeroReconciliationModal from 'main/pages/BillingPage/XeroReconciliationModal';
import ModalActions from 'main/actions/ModalActions';
import InvoiceActions from 'main/actions/InvoiceActions';
import InvoiceStore from 'main/stores/InvoiceStore';

class BillingHistory extends React.Component {

  static get propTypes() {
    return {
      pastInvoices: PropTypes.instanceOf(Immutable.Iterable)
    };
  }

  componentDidMount() {
    InvoiceActions.fetchPastInvoices();
  }

  reconcileModalId(month) {
    return `${XeroReconciliationModal.MODAL_ID}_${month}`;
  }

  footerInvoiceId({ month }) {
    return (
      <span>
        <a onClick={() => { ModalActions.open(this.reconcileModalId(month)); }}>
          Reconcile with Xero
        </a>
        <XeroReconciliationModal modalId={this.reconcileModalId(month)} date={month} />
      </span>
    );
  }

  renderOrganization = (invoice) => {
    return <BaseTableTypes.CustomerOrganizationUrl org={invoice.get('organization')} />;
  };

  renderCreatedDate = (invoice) => {
    const createdAt = invoice.get('created_at');
    return (
      createdAt ? <DateTime timestamp={createdAt} /> : '-'
    );
  };

  renderChargedDate = (invoice) => {
    const chargedAt = invoice.get('charged_at');
    return (
      chargedAt ? <DateTime timestamp={chargedAt} /> : '-'
    );
  };

  renderForgivenDate = (invoice) => {
    const forgivenAt = invoice.get('forgiven_at');
    return (
      forgivenAt ? <DateTime timestamp={forgivenAt} /> : '-'
    );
  };

  renderPaymentMethod = (invoice) => {
    const pm = invoice.get('payment_method');
    let icon;
    if (pm && pm.get('payment_type') === 'CreditCard') {
      icon = <i className="fa fa-credit-card fa-fw" />;
    } else if (pm && pm.get('payment_type') === 'PurchaseOrder') {
      icon = <i className="far fa-file fa-fw" />;
    } else {
      icon = <i className="far fa-question-circle fa-fw" />;
    }
    const PaymentMethod = pm && pm.get('payment_type') === 'PurchaseOrder' ?
      `PO: ${pm && pm.get('po_reference_number')}` : pm && pm.get('description');

    return (
      <span>
        {icon}
        {' '}
        {PaymentMethod}
      </span>
    );

  };

  renderInvoiceID = (invoice) => {
    const comp = (
      <a
        href={`https://go.xero.com/AccountsReceivable/View.aspx?invoiceID=${invoice.get('xero_invoice_guid')}`}
        target="_new"
      >
        {invoice.get('xero_invoice_number')}
      </a>
    );
    return comp;
  };

  renderContact = (invoice) => {
    const name = invoice.getIn(['contact_user', 'name']) ? invoice.getIn(['contact_user', 'name']) : '-';
    const email = invoice.getIn(['contact_user', 'email']) ? invoice.getIn(['contact_user', 'email']) : '-';
    return `${name} <${email}>`;
  };

  renderTotal = (invoice) => {
    const total = invoice.get('total');
    return total ? Accounting.formatMoney(total) : '-';
  };

  renderFooterChargedDate({ group }) {
    const amount = group
      .filter(m => m.get('charged_at') != undefined)
      .map(m => m.get('total'))
      .reduce((m, o) => parseFloat(m) + parseFloat(o));

    return Accounting.formatMoney(amount);
  }

  render() {
    if (!this.props.pastInvoices) {
      return <Spinner />;
    }
    return (
      this.props.pastInvoices
        .groupBy((ch) => {
          return Moment(ch.get('charged_at')).format('YYYY-MM-01');
        })
        .sortBy((group, month) => month)
        .reverse()
        .map((group, month) => {
          return (
            <Table
              loaded
              disabledSelection
              id={month}
              key={month}
              data={group.sortBy(invoice => invoice.get('xero_invoice_number')).reverse()}
            >
              <Column
                renderCellContent={this.renderOrganization}
                header="Organization"
                id="organization-column"
              />
              <Column
                renderCellContent={this.renderCreatedDate}
                header="Created Date"
                id="created-date-column"
              />
              <Column
                renderCellContent={this.renderChargedDate}
                header="Charged Date"
                id="charged-date-column"
              />
              <Column renderCellContent={this.renderForgivenDate} header="Forgiven Date" id="forgiven-date-column" />
              <Column renderCellContent={this.renderPaymentMethod} header="Payment Method" id="payment-method-column" />
              <Column
                renderCellContent={this.renderInvoiceID}
                header="Invoice ID"
                id="invoice-id-column"
                footer={() => this.footerInvoiceId({ month })}
              />
              <Column renderCellContent={this.renderContact} header="Contact" id="contact-column"  footer={'Total'} />
              <Column
                renderCellContent={this.renderTotal}
                header="Total"
                id="total-column"
                style={{ textAlign: 'right' }}
                footer={
                () => this.renderFooterChargedDate({ group })}
              />
            </Table>
          );
        })
    );
  }
}

const getStateFromStores = function() {
  const invoices = rootNode.get('pastInvoices');
  const pastInvoicesIds = invoices && _.map(invoices.toJS(), 'id');

  return {
    pastInvoices: pastInvoicesIds && Immutable.List(InvoiceStore.getByIds(pastInvoicesIds))
  };
};

export default ConnectToStores(BillingHistory, getStateFromStores);
export { BillingHistory as BillingHistoryTable };
