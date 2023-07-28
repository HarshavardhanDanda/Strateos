import React from 'react';
import Immutable from 'immutable';
import Accounting from 'accounting';
import PropTypes from 'prop-types';

import ConnectToStores from 'main/containers/ConnectToStoresHOC';
import { Table, Column, DateTime } from '@transcriptic/amino';
import { Loading } from 'main/components/page';
import rootNode from 'main/state/rootNode';
import BaseTableTypes from 'main/components/BaseTableTypes';
import InvoiceActions from 'main/actions/InvoiceActions';
import InvoiceStore from 'main/stores/InvoiceStore';

class Invoices extends React.Component {

  classNameRow(invoice) {
    if (invoice.get('forgiven_at')) {
      return 'danger';
    } else if (invoice.get('charged_at')) {
      return 'success';
    } else {
      return null;
    }
  }

  renderOrganization = (invoice) => {
    return <BaseTableTypes.CustomerOrganizationUrl org={invoice.get('organization')} />;
  };

  renderCreatedDate = (invoice) => {
    return (
      invoice.get('created_at') ? <DateTime timestamp={invoice.get('created_at')} /> : '-'
    );
  };

  renderChargedDate = (invoice) => {
    return (
      invoice.get('charged_at') ? <DateTime timestamp={invoice.get('charged_at')} /> : '-'
    );
  };

  renderForgivenDate = (invoice) => {
    return (
      invoice.get('forgiven_at') ? <DateTime timestamp={invoice.get('forgiven_at')} /> : '-'
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
    const paymentMethod = pm && pm.get('payment_type') === 'PurchaseOrder' ?
      `PO: ${pm && pm.get('po_reference_number')}` : invoice.getIn(['payment_method', 'description']);

    return (
      <span>
        {icon}
        {' '}
        {paymentMethod}
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
    return invoice.get('total') ? Accounting.formatMoney(invoice.get('total')) : '-';
  };

  renderFooterTotal = ({ field }) => {
    return Accounting.formatMoney(
      rootNode
        .get(field)
        .filter(m => m.get('attributes').get('charged_at') != undefined)
        .map(m => m.get('attributes').get('total'))
        .reduce((m, o) => parseFloat(m) + parseFloat(o))
    );
  };

  render() {
    return (
      <div className="invoices">
        { this.props.invoices ? (
          <Table
            loaded
            footer
            disabledSelection
            classNameRow={this.classNameRow}
            data={this.props.invoices.sortBy(invoice => invoice.get('xero_invoice_number'))}
            id={this.props.field}
          >
            <Column renderCellContent={this.renderOrganization} header="Organization" id="1" />
            <Column
              renderCellContent={this.renderCreatedDate}
              header="Created Date"
              id="2"
            />
            <Column renderCellContent={this.renderChargedDate} header="Charged Date" id="3" />
            <Column renderCellContent={this.renderForgivenDate} header="Forgiven Date" id="4" />
            <Column renderCellContent={this.renderPaymentMethod} header="Payment Method" id="5" />
            <Column renderCellContent={this.renderInvoiceID} header="Invoice ID" id="6" />
            <Column renderCellContent={this.renderContact} header="Contact" id="7"  footer="Total" />
            <Column
              renderCellContent={this.renderTotal}
              style={{ textAlign: 'right' }}
              header="Total"
              id="8"
              footer={() => this.renderFooterTotal({ field: this.props.field })}
            />
          </Table>
        )
          :
          <Loading />
         }
      </div>
    );
  }

}

Invoices.propTypes = {
  invoices: PropTypes.instanceOf(Immutable.Iterable),
  field: PropTypes.string.isRequired
};

const getStateFromStores = (props) => {
  const invoices = rootNode.get(props.field);
  const qcInvoices = invoices && invoices.map((invoice) => {
    const invoiceId = invoice.get('id');
    const invoiceFromStore = InvoiceStore.getById(invoiceId);
    return invoiceFromStore;
  });
  return { invoices: qcInvoices };
};

const ConnectedInvoices = ConnectToStores(Invoices, getStateFromStores);

class QualityControl extends React.Component {
  componentDidMount() {
    InvoiceActions.fetchDelayedInvoices();
    InvoiceActions.fetchBadInvoices();
  }

  render() {
    return (
      <div>
        <h2>Long Delayed Invoices (&#62; 15 days creation to charge)</h2>
        <ConnectedInvoices field="delayedInvoices" />
        <h2>Bad Invoices</h2>
        <ConnectedInvoices field="badInvoices" />
      </div>
    );
  }
}

export default QualityControl;
export { Invoices };
