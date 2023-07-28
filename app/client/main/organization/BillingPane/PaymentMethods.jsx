import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React     from 'react';
import _ from 'lodash';
import Accounting from 'accounting';
import { Button, Table, Column, DateTime, Popover } from '@transcriptic/amino';

import { Loading } from 'main/components/page';
import connectToStoresHOC from 'main/containers/ConnectToStoresHOC';
import PaymentMethodStore from 'main/stores/PaymentMethodStore';
import PaymentMethodActions from 'main/actions/PaymentMethodActions';
import { PaymentInfoModal } from 'main/organization/PaymentInfo';
import ModalActions from 'main/actions/ModalActions';

const PAYMENT_INFO_MODAL_ID = 'BILLING_PANE_PAYMENT_MODAL';

const renderTableRecord = (record, rowIndex, colIndex) => {

  if (record.get('pm').get('is_default?') && colIndex === 0) {
    return (
      <div>
        <i className="fa fa-star billing__default" />
        { record.get((colIndex + 1).toString()) }
      </div>
    );
  } else {
    return (
      <Popover
        content={<span>{record.get((colIndex + 1).toString())}</span>}
        placement="bottom"
        trigger="hover"
        showWhenOverflow
      >
        { record.get((colIndex + 1).toString()) }
      </Popover>
    );
  }
};

const renderAddressRecord = (record) => {
  const pm = record.get('pm');
  const address = pm.get('address');
  const pm_address = address ? `${address.get('attention')}, ${address.get('street')}, 
    ${address.get('street_2') ? `${address.get('street_2')}, ` : ''} 
    ${address.get('city')}, ${address.get('country')}` : 'Not found';
  return (
    <Popover
      content={<span>{pm_address}</span>}
      placement="bottom"
      trigger="hover"
      showWhenOverflow
    >
      { pm_address }
    </Popover>
  );

};

const renderDate = pm => {
  return (
    pm.get('expiry') ? <DateTime timestamp={pm.get('expiry')} format="paymentCard" /> : '--'
  );
};

const renderDateRecord = (record) => {
  return renderDate(record.get('pm'));
};

const getCreditCardRecords = (creditCards) => {
  const records = [];
  if (creditCards.length > 0) {
    let key = 1;
    creditCards.reverse().forEach(cc => {
      const record = {};
      record.id = key;
      record.pm = cc;
      record[1] = `${cc.get('credit_card_type')} ending in ${cc.get('credit_card_last_4')}`;
      record[2] = cc.get('credit_card_name');
      record[3] = '';
      record[4] = '';
      key++;
      records.push(record);
    });
    return Immutable.fromJS(records);
  }
  return records;
};

const getPurchaseOrderRecords = (purchaseOrders) => {
  const records = [];
  if (purchaseOrders.length > 0) {
    let key = 1;
    purchaseOrders.reverse().forEach(po => {
      const record = {};
      record.id = key;
      record.pm = po;
      record[1] = po.get('po_reference_number');
      record[2] = po.get('description');
      record[3] = po.get('po_approved_at') ? 'Approved' : 'Pending Approval';
      record[4] = `${Accounting.formatMoney(po.get('po_limit'))}`;
      record[5] = `${Accounting.formatMoney(po.get('limit'))}`;
      record[6] = '';
      record[7] = '';
      record[8] = '';
      key++;
      records.push(record);
    });
    return Immutable.fromJS(records);
  }
  return records;
};

class PaymentMethods extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      modalType: ''
    };
    _.bindAll(
      this,
      'renderActionRecord',
      'renderActions'
    );
  }

  getPurchaseOrdersTable(purchaseOrderRecords) {
    if (_.isEmpty(purchaseOrderRecords)) {
      return (
        <p className="tx-type--secondary">Add a purchase order to use a payment method.</p>
      );
    } else {
      return (
        <div>
          <Table
            data={purchaseOrderRecords}
            loaded
            disabledSelection
            id="purchase-orders-table"
          >
            <Column renderCellContent={renderTableRecord} header="Reference #" id="reference-id-column" />
            <Column renderCellContent={renderTableRecord} header="Alias" id="alias-column" />
            <Column renderCellContent={renderTableRecord} header="Status" id="status-column" />
            <Column renderCellContent={renderTableRecord} header="Limit" id="limit-column" />
            <Column renderCellContent={renderTableRecord} header="Remaining" id="remaining-limit-column" />
            <Column renderCellContent={renderAddressRecord} header="Address" id="address-column" />
            <Column renderCellContent={renderDateRecord} header="Expires" id="expiry-date-column" />
            <Column renderCellContent={this.renderActionRecord} header="Actions" id="actions-column" relativeWidth={1.5} />
          </Table>
        </div>
      );
    }
  }

  getCreditCardsTable(creditCardRecords) {
    if (_.isEmpty(creditCardRecords)) {
      return (
        <p className="tx-type--secondary">Before you launch a new run, you must add a credit card.</p>
      );
    } else {
      return (
        <Table
          data={creditCardRecords}
          loaded
          disabledSelection
          id="credit-cards-table"
        >
          <Column renderCellContent={renderTableRecord} header="Card" id="card-name-column" />
          <Column renderCellContent={renderTableRecord} header="Name on Card" id="name-column" />
          <Column renderCellContent={renderDateRecord} header="Expires" id="expiry-date-column" />
          <Column renderCellContent={this.renderActionRecord} header="Actions" id="actions-column" />
        </Table>
      );
    }
  }

  renderActionRecord(record) {
    return this.renderActions(record.get('pm'));
  }

  renderActions(pm) {
    const { subdomain, customerOrganizationId } = this.props;
    return (
      <div className="billing__action tx-inline tx-inline--xs">
        <Button
          type="secondary"
          link
          icon="fa fa-trash"
          label="Delete"
          onClick={() => {
            if (confirm('Are you sure you want to delete this payment method?')) {
              return PaymentMethodActions.destroyPaymentMethod(pm.get('id'), subdomain, customerOrganizationId);
            }
            return undefined;
          }}
        />
        {pm.get('type') === 'PurchaseOrder' &&
        (
          <Button
            type="secondary"
            link
            icon="fa fa-edit"
            label="Edit"
            onClick={() => {
              this.setState({ modalType: 'editpurchaseorder' });
              ModalActions.openWithData(PAYMENT_INFO_MODAL_ID, pm);
            }}
          />
        )
        }
        {(!pm.get('is_default?') && pm.get('can_make_default')) &&
        (
          <Button
            type="secondary"
            link
            icon="fa fa-star"
            label="Default"
            onClick={() => { PaymentMethodActions.makeDefault(pm.get('id'), subdomain, customerOrganizationId); }}
          />
        )
        }
      </div>
    );

  }

  render() {
    if (!this.props.payment_methods || !this.props.payment_methods_loaded) {
      return <Loading />;
    }

    const creditCards = (this.props.payment_methods.filter(pm => pm.get('type') === 'CreditCard')).toArray();
    const purchaseOrders = (this.props.payment_methods.filter(pm => pm.get('type') === 'PurchaseOrder')).toArray();
    const creditCardRecords = getCreditCardRecords(creditCards);
    const purchaseOrderRecords = getPurchaseOrderRecords(purchaseOrders);

    return (
      <div className="tx-stack tx-stack--sm">
        <div className="add-credit-card">
          <h4>
            Credit Cards
            <Button
              className="billing__add"
              type="primary"
              link
              heavy
              icon="fas fa-plus"
              onClick={() => {
                this.setState({ modalType: 'creditcard' });
                ModalActions.open(PAYMENT_INFO_MODAL_ID);
              }}
            >
              ADD
            </Button>
          </h4>
        </div>
        <div className="credit-card-table">
          {this.getCreditCardsTable(creditCardRecords)}
        </div>
        <div className="add-purchase-order">
          <h4>
            Purchase Orders
            <PaymentInfoModal
              modalId={PAYMENT_INFO_MODAL_ID}
              modalType={this.state.modalType}
              subdomain={this.props.subdomain}
              customerOrganizationId={this.props.customerOrganizationId}
            />
            <Button
              className="billing__add"
              type="primary"
              link
              heavy
              icon="fas fa-plus"
              onClick={() => {
                this.setState({ modalType: 'purchaseorder' });
                ModalActions.open(PAYMENT_INFO_MODAL_ID);
              }}
            >
              ADD
            </Button>
          </h4>
        </div>
        <div className="purchase-order-table">
          {this.getPurchaseOrdersTable(purchaseOrderRecords)}
        </div>
      </div>
    );
  }
}

PaymentMethods.propTypes = {
  payment_methods: PropTypes.instanceOf(Immutable.Iterable).isRequired,
  payment_methods_loaded: PropTypes.bool.isRequired
};

const getStateFromStores = () => {
  const payment_methods = PaymentMethodStore.getAll();
  const payment_methods_loaded = PaymentMethodStore.isLoaded();

  return {
    payment_methods,
    payment_methods_loaded
  };
};

export default connectToStoresHOC(PaymentMethods, getStateFromStores);
export { PaymentMethods };
