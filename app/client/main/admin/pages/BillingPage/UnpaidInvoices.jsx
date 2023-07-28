import Accounting from 'accounting';
import _          from 'lodash';
import React      from 'react';

import { Button, ButtonGroup, Table, Column } from '@transcriptic/amino';

import ModalActions        from 'main/actions/ModalActions';
import NotificationActions from 'main/actions/NotificationActions';
import ConnectToStores     from 'main/containers/ConnectToStoresHOC';
import Dispatcher          from 'main/dispatcher';
import CRUDStore           from 'main/util/CRUDStore';
import ajax                from 'main/util/ajax';
import Urls                from 'main/util/urls';

import CreateInvoiceItemModal from 'main/components/CreateInvoiceItemModal';

import './UnpaidInvoices.scss';

const UnpaidInvoiceStore = _.extend({}, CRUDStore('unpaidInvoices'), {
  act(action) {
    switch (action.type) {
      case 'UNPAID_INVOICE_LIST':
        this._receiveData(action.invoices);
        break;

      case 'UNPAID_INVOICE_SELECT':
        this._receiveData([{
          id: action.id,
          selected: action.selected
        }]);
        break;

      case 'UNPAID_INVOICE_SELECT_ALL':
        this._objects.update(objs =>
          objs.map(obj => obj.set('selected', true))
        );
        break;

      case 'UNPAID_INVOICE_SELECT_NONE':
        this._objects.update(objs =>
          objs.map(obj => obj.set('selected', false))
        );
        break;

      case 'UNPAID_INVOICE_CHARGING':
        this._objects.update((objs) => {
          let setObjects = objs;
          _.each(action.invoice_ids, (value, id) => {
            setObjects = objs.setIn([id, 'charge_in_progress'], true);
          });

          return setObjects;
        });
        break;

      case 'UNPAID_INVOICE_CHARGE_FAILED':
        this._receiveData([
          {
            id: action.id,
            charge_in_progress: false
          }
        ]);
        break;

      default:

    }
  },

  getAll() {
    return this._objects
      .get()
      .filter(x => x.get('forgiven_at') == undefined && x.get('remitted_at') == undefined)
      .valueSeq();
  },

  // sorts by invoice year, month, orgname
  getAllSorted() {
    const compareMapper = (inv) => {
      const orgName = inv.getIn(['organization', 'name'], '');
      const yearMonthStr = inv.get('month', '');

      if (!yearMonthStr.match(/\d+-\d+/)) {
        return [0, 0, orgName];
      }

      const [yearStr, monthStr] = Array.from(yearMonthStr.split('-'));

      // array of values to sort on
      return [parseInt(yearStr, 10), parseInt(monthStr, 10), orgName];
    };

    const comparator = (arr1, arr2) => {
      // year
      if (arr1[0] < arr2[0]) {
        return -1;
      }
      if (arr1[0] > arr2[0]) {
        return 1;
      }

      // month
      if (arr1[1] < arr2[1]) {
        return -1;
      }
      if (arr1[1] > arr2[1]) {
        return 1;
      }

      // org, in reverse order
      return -1 * arr1[2].localeCompare(arr2[2]);
    };

    return UnpaidInvoiceStore.getAll().sortBy(compareMapper, comparator);
  }
});

UnpaidInvoiceStore._register(Dispatcher);

const sequentially = (fns) => {
  let initial;
  const promise = fns.reduce((m, o) => m.then(o), (initial = ajax.Deferred()));
  initial.resolve();
  return promise;
};

const UnpaidInvoiceActions = {
  initialize() {
    return ajax.get('/admin/billing').done((data) => {
      Dispatcher.dispatch({
        type: 'UNPAID_INVOICE_LIST',
        invoices: data
      });
    });
  },

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
      invoice_ids: ids.toJS()
    });

    return sequentially(ids.map(id => () => {
      return ajax
        .post('/admin/billing/charge_invoices', {
          invoice_ids: [id]
        })
        .done((data) => {

          _.each(Array.from(data), (inv) => {
            inv.charge_in_progress = false;
          });

          Dispatcher.dispatch({
            type: 'UNPAID_INVOICE_LIST',
            invoices: data
          });
        })
        .fail(() =>
          Dispatcher.dispatch({
            type: 'UNPAID_INVOICE_CHARGE_FAILED',
            id
          })
        );
    }))
      .fail(err => NotificationActions.handleError(err));
  },

  forgive(ids) {
    return ajax
      .post('/admin/billing/forgive_invoices', {
        invoice_ids: ids
      })
      .done(data =>
        Dispatcher.dispatch({
          type: 'UNPAID_INVOICE_LIST',
          invoices: data
        })
      )
      .fail(err => NotificationActions.handleError(err));
  },

  remit(ids) {
    return ajax
      .post('/admin/billing/remit_invoices', {
        invoice_ids: ids
      })
      .done(data =>
        Dispatcher.dispatch({
          type: 'UNPAID_INVOICE_LIST',
          invoices: data
        })
      )
      .fail(err => NotificationActions.handleError(err));
  },

  createInvoice(id) {
    return ajax
      .post('/admin/billing/create_invoice', { invoice_id: id })
      .done(data =>
        Dispatcher.dispatch({ type: 'UNPAID_INVOICE_LIST', invoices: [data] })
      )
      .fail(err =>
        NotificationActions.handleError(err)
      );
  }
};

function Organization(inv) {
  return (
    <a
      href={Urls.use(inv.getIn(['organization', 'subdomain'])).organization_overview()}
    >
      { inv.getIn(['organization', 'name']) }
    </a>
  );
}

function Name(inv) {
  return inv.get('reference');
}

function Status(inv) {
  return (
    <Choose>
      <When condition={inv.get('remitted_at') != undefined}>
        <span className="label label-success">
          Remitted
        </span>
      </When>

      <When condition={inv.get('forgiven_at') != undefined}>
        <span className="label label-danger">
          Forgiven
        </span>
      </When>

      <When condition={inv.get('charged_at') != undefined}>
        <span className="label label-warning">
          Charged
        </span>
      </When>

      <When condition={inv.get('declined_at')}>
        <span className="label label-danger">
          Declined
        </span>
      </When>

      <Otherwise>
        <span className="label label-default">
          Pending
        </span>
      </Otherwise>
    </Choose>
  );
}

function InvoiceProviderID(inv) {
  return (
    <Choose>
      <When condition={inv.get('xero_invoice_number') || inv.get('netsuite_invoice_id')}>
        <a
          href={Urls.use(
            inv.getIn(['organization', 'subdomain'])
          )
            .invoice(inv.get('id'))}
        >
          { inv.get('xero_invoice_number') ? inv.get('xero_invoice_number') : inv.get('netsuite_invoice_id') }
        </a>
      </When>

      <Otherwise>—</Otherwise>
    </Choose>
  );
}

function PaymentMethod(inv) {
  return (
    <Choose>
      <When condition={inv.getIn(['payment_method', 'type']) === 'PurchaseOrder'}>
        { `PO: ${inv.getIn(['payment_method', 'po_reference_number'])}` }
      </When>

      <Otherwise>
        { inv.getIn(['payment_method', 'description']) }
      </Otherwise>
    </Choose>
  );
}

function Total(inv) {
  return Accounting.formatMoney(inv.get('total'));
}

function FooterTotal(data) {
  return Accounting.formatMoney(
    data.reduce(
      (m, inv) => m + parseFloat(inv.get('total')),
      0
    )
  );
}

class UnpaidInvoices extends React.Component {

  constructor(props) {
    super(props);
    this.state = { selected: {} };
  }

  componentDidMount() {
    UnpaidInvoiceActions.initialize();
  }

  isAnySelected() {
    return _.size(this.state.selected) !== 0;
  }

  isOneSelected() {
    return _.size(this.state.selected) === 1;
  }

  getAllSelected() {
    return this.props.data.filter(x => x.get('id') in this.state.selected);
  }

  allSelectedInXeroOrNetSuite() {
    return this.getAllSelected().every(x => x.get('xero_invoice_guid') != undefined || x.get('netsuite_invoice_id') != undefined);
  }

  allSelectedNotInXeroAndNetSuite() {
    return this.getAllSelected().every(x => x.get('xero_invoice_guid') == undefined && x.get('netsuite_invoice_id') == undefined);
  }

  onSelectAll(selectedRows) {
    this.setState({ selected: selectedRows });
    if (selectedRows) {
      return UnpaidInvoiceActions.selectAll();
    }
    return UnpaidInvoiceActions.selectNone();
  }

  onSelectRow(record, isChecked, selectedRows) {
    this.setState({ selected: selectedRows });
    UnpaidInvoiceActions.select(record.get('id'), isChecked);
  }

  charge(done) {
    const selected = this.getAllSelected();

    if (!confirm(`Charge ${selected.count()} invoices?`)) {
      return done();
    }

    return UnpaidInvoiceActions.charge(selected.map(x => x.get('id'))).always(done);
  }

  forgive(done) {
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
      .always(done);
  }

  remit(done) {
    const selected = this.getAllSelected();
    const amountToRemit = Accounting.formatMoney(
      selected.reduce((m, x) => m + parseFloat(x.get('total')), 0)
    );
    if (!confirm(`Remit ${selected.count()} invoices totalling ${amountToRemit}?`)) {
      return done();
    }

    return UnpaidInvoiceActions.remit(selected.map(x => x.get('id'))).always(done);
  }

  createInvoice(done) {
    const invoice = this.getAllSelected().first();
    const orgName = invoice.getIn(['organization', 'name']);
    const total   = Accounting.formatMoney(parseFloat(invoice.get('total')));

    if (!confirm(`Create Invoice?: ${invoice.get('id')}, '${orgName}', '${total}'`)) {
      return done();
    }

    return UnpaidInvoiceActions.createInvoice(invoice.get('id')).always(done);
  }

  openCreateInvoiceItemModal(done) {
    ModalActions.open(CreateInvoiceItemModal.modalId);
    done();
  }

  render() {
    const allSelectedInXeroOrNetSuite    = this.allSelectedInXeroOrNetSuite();
    const allSelectedNotInXeroAndNetSuite = this.allSelectedNotInXeroAndNetSuite();
    const isAnySelected        = this.isAnySelected();
    const isOneSelected        = this.isOneSelected();

    return (
      <div className="unpaid-invoices">
        <div className="actions">
          <div className="selection-actions">
            <ButtonGroup>
              <Button
                type="primary"
                waitForAction
                disabled={!(isAnySelected && allSelectedInXeroOrNetSuite)}
                onClick={done => this.charge(done)}
              >
                Charge
              </Button>
              <Button
                waitForAction
                type="danger"
                disabled={!(isAnySelected && allSelectedInXeroOrNetSuite)}
                onClick={done => this.forgive(done)}
              >
                Forgive
              </Button>
              <Button
                waitForAction
                type="danger"
                disabled={
                  !(
                    isAnySelected &&
                    allSelectedInXeroOrNetSuite &&
                    this.getAllSelected().every(x => x.get('charged_at') != undefined)
                  )
                }
                onClick={done => this.remit(done)}
              >
                Remit
              </Button>
              <Button
                waitForAction
                type="info"
                disabled={!(isOneSelected && allSelectedNotInXeroAndNetSuite)}
                onClick={done => this.createInvoice(done)}
              >
                Create Invoice
              </Button>
              <Button
                waitForAction
                type="info"
                disabled={!(isOneSelected && allSelectedNotInXeroAndNetSuite)}
                onClick={done => this.openCreateInvoiceItemModal(done)}
              >
                Create Invoice Item
              </Button>
            </ButtonGroup>

            <CreateInvoiceItemModal invoice={this.getAllSelected().first()} isAdmin />
          </div>
          <div className="table-actions">
            <Button
              type="default"
              to="/admin/billing/po_labels.pdf"
              tagLink
              newTab
            >
              Download PO Address Labels
            </Button>
          </div>
        </div>
        <Table
          onSelectRow={(record, willBeChecked, selectedRows) => this.onSelectRow(record, willBeChecked, selectedRows)}
          onSelectAll={(selectedRows) => this.onSelectAll(selectedRows)}
          {...this.props}
          selected={this.state.selected}
          id="UnpaidInvoices"
        >
          <Column renderCellContent={Organization} header="Organization" id="Organization" />
          <Column renderCellContent={Name} header="Name" id="Name" />
          <Column renderCellContent={Status} header="Status" id="Status" />
          <Column renderCellContent={InvoiceProviderID} header="InvoiceProvider ID" id="InvoiceProvider ID" />
          <Column renderCellContent={PaymentMethod} header="Payment method" id="Payment method" />
          <Column
            renderCellContent={Total}
            header="Total"
            footer={FooterTotal}
            style={{ textAlign: 'right' }}
            id="Total"
          />
        </Table>
      </div>
    );
  }
}

const getStateFromStores = () => {
  const loaded = UnpaidInvoiceStore.isLoaded();
  const data   = UnpaidInvoiceStore.getAllSorted().reverse();

  return {
    loaded,
    data,
    emptyMessage: 'No unpaid invoices.'
  };
};

const ConnectedUnpaidInvoices = ConnectToStores(UnpaidInvoices, getStateFromStores);

export default ConnectedUnpaidInvoices;
export { UnpaidInvoices };
