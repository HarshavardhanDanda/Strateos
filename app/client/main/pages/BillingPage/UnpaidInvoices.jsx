import Accounting from 'accounting';
import _ from 'lodash';
import moment from 'moment';
import Immutable from 'immutable';
import React from 'react';

import { Column, List, StatusPill } from '@transcriptic/amino';
import ModalActions from 'main/actions/ModalActions';
import BaseTableTypes from 'main/components/BaseTableTypes';
import InvoiceActions from 'main/actions/InvoiceActions';
import ConnectToStores from 'main/containers/ConnectToStoresHOC';
import UnpaidInvoiceActions from 'main/actions/UnpaidInvoiceActions';
import UnpaidInvoiceStore from 'main/stores/UnpaidInvoicesStore';
import InvoiceStore from 'main/stores/InvoiceStore';
import Urls from 'main/util/urls';
import FeatureStore from 'main/stores/FeatureStore';
import FeatureConstants from '@strateos/features';
import CreateInvoiceItemModal from './CreateInvoiceItemModal';
import './UnpaidInvoices.scss';

class UnpaidInvoices extends React.Component {

  constructor(props) {
    super(props);
    this.state = { selected: {} };
  }

  componentDidMount() {
    InvoiceActions.fetchPendingInvoices();
  }

  isOneSelected = () => {
    return _.size(this.state.selected) === 1;
  };

  getAllSelected = () => {
    return this.props.data.filter(x => x.get('id') in this.state.selected);
  };

  allSelectedInXeroOrNetSuite = () => {
    return this.getAllSelected().every(x => x.get('xero_invoice_guid') != undefined || x.get('netsuite_invoice_id') != undefined);
  };

  allSelectedNotInXeroAndNetSuite = () => {
    return this.getAllSelected().every(x => x.get('xero_invoice_guid') == undefined && x.get('netsuite_invoice_id') == undefined);
  };

  onSelectAll = (selectedRows) => {
    this.setState({ selected: selectedRows });
    if (selectedRows) {
      return UnpaidInvoiceActions.selectAll();
    }
    return UnpaidInvoiceActions.selectNone();
  };

  onSelectRow = (record, isChecked, selectedRows) => {
    this.setState({ selected: selectedRows });
    UnpaidInvoiceActions.select(record.get('id'), isChecked);
  };

  charge = (done) => {
    const selected = this.getAllSelected();

    if (!confirm(`Charge ${selected.count()} invoices?`)) {
      return done();
    }

    return UnpaidInvoiceActions.charge(selected.map(x => x.get('id'))).always(() =>
      this.setState({ selected: {} }),
    done);
  };

  forgive = (done) => {
    const selected = this.getAllSelected();
    const amountToForgive = Accounting.formatMoney(
      selected.reduce((m, x) => m + parseFloat(x.get('total')), 0)
    );
    if (!confirm(`Forgive ${selected.count()} invoices?`)) {
      return done();
    }
    if (!confirm(`Really forgive ${selected.count()} invoices totalling ${amountToForgive} ?`)) {
      return done();
    }
    return UnpaidInvoiceActions.forgive(selected.map(x => x.get('id')))
      .done(() => this.setState({ selected: {} })).always(done);
  };

  remit = (done) => {
    const selected = this.getAllSelected();
    const amountToRemit = Accounting.formatMoney(
      selected.reduce((m, x) => m + parseFloat(x.get('total')), 0)
    );
    if (!confirm(`Remit ${selected.count()} invoices totalling ${amountToRemit}?`)) {
      return done();
    }

    return UnpaidInvoiceActions.remit(selected.map(x => x.get('id')))
      .done(() => this.setState({ selected: {} })).always(done);
  };

  createNetsuiteInvoice = (done) => {
    const invoice = this.getAllSelected().first();
    const orgName = invoice.getIn(['organization', 'name']);
    const total   = Accounting.formatMoney(parseFloat(invoice.get('total')));

    if (!confirm(`Create Invoice?: ${invoice.get('id')}, '${orgName}', '${total}'`)) {
      return done();
    }

    return UnpaidInvoiceActions.createNetsuiteInvoice(invoice.get('id')).always(() =>
      this.setState({ selected: {} }),
    done);
  };

  openCreateInvoiceItemModal = (done) => {
    ModalActions.open(CreateInvoiceItemModal.modalId);
    done();
  };

  renderOrganization = (inv) => {
    return <BaseTableTypes.CustomerOrganizationUrl org={inv.get('organization')} />;
  };

  renderName = (inv) => {
    return inv.get('reference');
  };

  renderStatus = (invoices) => {
    let statusElement;
    if (invoices.get('remitted_at') != undefined) {
      statusElement = <StatusPill type="success" text="Remitted" shape="tag" />;
    } else if (invoices.get('forgiven_at') != undefined) {
      statusElement = <StatusPill type="danger" text="Forgiven" shape="tag" />;
    } else if (invoices.get('charged_at') != undefined) {
      statusElement = <StatusPill type="warning" text="Charged" shape="tag" />;
    } else if (invoices.get('declined_at')) {
      statusElement = <StatusPill type="danger" text="Declined" shape="tag" />;
    } else {
      statusElement = <StatusPill text="Pending" shape="tag" />;
    }
    return statusElement;
  };

  renderInvoiceProviderID = (inv) => {
    return (
      (inv.get('xero_invoice_number') || inv.get('netsuite_invoice_id')) ? (
        <BaseTableTypes.Text data={inv.get('xero_invoice_number') ? inv.get('xero_invoice_number') : inv.get('netsuite_invoice_id')} />
      ) :
        '-'
    );
  };

  renderPaymentMethod = (inv) => {
    return (
      (inv.getIn(['payment_method', 'type']) === 'PurchaseOrder') ?
        `PO: ${inv.getIn(['payment_method', 'po_reference_number'])}` :
        inv.getIn(['payment_method', 'description'])
    );
  };

  renderTotal = (inv) => {
    return Accounting.formatMoney(inv.get('total'));
  };

  renderFooterTotal = (data) => {
    return Accounting.formatMoney(
      data.reduce(
        (m, inv) => m + parseFloat(inv.get('total')),
        0
      )
    );
  };

  render() {

    const allSelectedInXeroOrNetSuite    = this.allSelectedInXeroOrNetSuite();
    const allSelectedNotInXeroAndNetSuite = this.allSelectedNotInXeroAndNetSuite();
    const isOneSelected        = this.isOneSelected();
    const last_month = moment().utc().subtract(1, 'months').format('YYYY-MM');
    const canManageInvoices = FeatureStore.hasPlatformFeature(FeatureConstants.MANAGE_INVOICES_GLOBAL);

    const defaultActions = [
      {
        title: 'Download PO Address Labels',
        to: `${Urls.generate_po_label_action()}?[month]=${last_month}`,
        tagLink: true,
        newTab: true
      }
    ];

    const actions = [
      {
        title: 'Charge',
        action: (_a, _b, done) => this.charge(done),
        disabled: !allSelectedInXeroOrNetSuite,
        waitForAction: true
      },
      {
        title: 'Forgive',
        action: (_a, _b, done) => this.forgive(done),
        disabled: !allSelectedInXeroOrNetSuite,
        waitForAction: true
      },
      {
        title: 'Remit',
        action: (_a, _b, done) => this.remit(done),
        disabled: !(
          allSelectedInXeroOrNetSuite &&
          this.getAllSelected().every(x => x.get('charged_at') != undefined)
        ),
        waitForAction: true
      },
      {
        title: 'Create invoice',
        action: (_a, _b, done) => this.createNetsuiteInvoice(done),
        disabled: !(isOneSelected && allSelectedNotInXeroAndNetSuite),
        waitForAction: true
      },
      {
        title: 'Create invoice item',
        action: (_a, _b, done) => this.openCreateInvoiceItemModal(done),
        disabled: !(isOneSelected && allSelectedNotInXeroAndNetSuite),
        waitForAction: true
      }
    ];

    return (
      <div className="unpaid-invoices">

        <CreateInvoiceItemModal invoice={this.getAllSelected().first()} />

        <List
          onSelectRow={(record, willBeChecked, selectedRows) => this.onSelectRow(record, willBeChecked, selectedRows)}
          onSelectAll={(selectedRows) => this.onSelectAll(selectedRows)}
          {...this.props}
          selected={this.state.selected}
          id="UnpaidInvoices"
          disableCard
          defaultActions={defaultActions}
          actions={canManageInvoices && actions}
          disabledSelection={!canManageInvoices}
        >
          <Column renderCellContent={this.renderOrganization} header="Organization" id="Organization" />
          <Column renderCellContent={this.renderName} header="Name" id="Name" />
          <Column renderCellContent={this.renderStatus} header="Status" id="Status" />
          <Column renderCellContent={this.renderInvoiceProviderID} header="InvoiceProvider ID" id="InvoiceProvider ID" />
          <Column renderCellContent={this.renderPaymentMethod} header="Payment method" id="Payment method" />
          <Column
            renderCellContent={this.renderTotal}
            header="Total"
            footer={this.renderFooterTotal}
            style={{ textAlign: 'right' }}
            id="Total"
          />
        </List>
      </div>
    );
  }
}

const getStateFromStores = () => {
  const loaded = UnpaidInvoiceStore.isLoaded();
  const data   = UnpaidInvoiceStore.getAllSorted().reverse();
  const invoiceIds = Array.from(data.map(invoice => invoice.get('id')));
  const invoices = InvoiceStore.getByIds(invoiceIds);

  return {
    loaded,
    data: Immutable.List(invoices),
    emptyMessage: 'No unpaid invoices.'
  };
};

const ConnectedUnpaidInvoices = ConnectToStores(UnpaidInvoices, getStateFromStores);

export default ConnectedUnpaidInvoices;
export { UnpaidInvoices };
