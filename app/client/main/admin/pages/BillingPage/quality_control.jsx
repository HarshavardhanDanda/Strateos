import React from 'react';
import Immutable from 'immutable';
import Accounting from 'accounting';
import PropTypes from 'prop-types';

import ConnectToStores from 'main/containers/ConnectToStoresHOC';
import Urls from 'main/util/urls';
import { Table, Column, DateTime } from '@transcriptic/amino';
import { Loading } from 'main/components/page';
import rootNode from 'main/state/rootNode';
import ajax from 'main/util/ajax';

const DelayedInvoiceActions = {
  initialize() {
    return ajax
      .get('/admin/billing/delayed_invoices')
      .done(data => rootNode.setIn('delayedInvoices', Immutable.fromJS(data)));
  }
};

const BadInvoiceActions = {
  initialize() {
    return ajax
      .get('/admin/billing/bad_invoices')
      .done(data => rootNode.setIn('badInvoices', Immutable.fromJS(data)));
  }
};

function Organization(inv) {
  const org = inv.get('organization');

  return (
    <a href={Urls.use(org.get('subdomain')).organization()}>
      { org.get('name') }
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
        <When condition={(pm ? pm.get('type') : undefined) === 'CreditCard'}>
          <i className="fa fa-credit-card fa-fw" />
        </When>
        <When condition={(pm ? pm.get('type') : undefined) === 'PurchaseOrder'}>
          <i className="far fa-file fa-fw" />
        </When>
        <Otherwise>
          <i className="far fa-question-circle fa-fw" />
        </Otherwise>
      </Choose>

      {' '}

      <Choose>
        <When condition={(pm ? pm.get('type') : undefined) === 'PurchaseOrder'}>
          { `PO: ${pm.get('po_reference_number')}` }
        </When>
        <Otherwise>
          { inv.getIn(['payment_method', 'description']) }
        </Otherwise>
      </Choose>
    </span>
  );
}

function InvoiceID(inv) {
  return (
    <a
      href={`https://go.xero.com/AccountsReceivable/View.aspx?invoiceID=${inv.get('xero_invoice_guid')}`}
      target="_new"
    >
      { inv.get('xero_invoice_number') }
    </a>
  );
}

function Contact(inv) {
  return `${inv.getIn(['contact_user', 'name'])} <${inv.getIn(['contact_user', 'email'])}>`;
}

function Total(inv) {
  return Accounting.formatMoney(inv.get('total'));
}

function FooterTotal({ field }) {
  return Accounting.formatMoney(
    rootNode
      .get(field)
      .filter(m => m.get('charged_at') != undefined)
      .map(m => m.get('total'))
      .reduce((m, o) => parseFloat(m) + parseFloat(o))
  );
}

class Invoices extends React.Component {

  classNameRow(inv) {
    if (inv.get('forgiven_at')) {
      return 'danger';
    } else if (inv.get('charged_at')) {
      return 'success';
    } else {
      return '';
    }
  }

  render() {
    const loaded = !!this.props.invoices;
    return (
      <div className="invoices">
        <Choose>
          <When condition={this.props.invoices}>
            <Table
              loaded={loaded}
              footer
              disabledSelection
              classNameRow={this.classNameRow}
              data={this.props.invoices.sortBy(inv => inv.get('xero_invoice_number'))}
              id={this.props.field}
            >
              <Column renderCellContent={Organization} header="Organization" id="1" footer="Total" />
              <Column
                renderCellContent={CreatedDate}
                header="Created Date"
                id="2"
                footer={() => FooterTotal({ field: this.props.field })}
              />
              <Column renderCellContent={ChargedDate} header="Charged Date" id="3" />
              <Column renderCellContent={ForgivenDate} header="Forgiven Date" id="4" />
              <Column renderCellContent={PaymentMethod} header="Payment Method" id="5" />
              <Column renderCellContent={InvoiceID} header="Invoice ID" id="6" />
              <Column renderCellContent={Contact} header="Contact" id="7" />
              <Column renderCellContent={Total} header="Total" id="8" />
            </Table>
          </When>
          <Otherwise>
            <Loading />
          </Otherwise>
        </Choose>
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

  return { invoices };
};

const ConnectedInvoices = ConnectToStores(Invoices, getStateFromStores);

class QualityControl extends React.Component {
  componentDidMount() {
    DelayedInvoiceActions.initialize();
    BadInvoiceActions.initialize();
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
