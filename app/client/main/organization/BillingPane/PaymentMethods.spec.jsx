import React from 'react';
import { shallow, mount } from 'enzyme';
import { expect } from 'chai';
import sinon from 'sinon';
import Immutable from 'immutable';
import ModalActions from 'main/actions/ModalActions';
import { Button } from '@transcriptic/amino';
import { PaymentMethods } from './PaymentMethods';

describe('Billing Card', () => {
  const sandbox = sinon.createSandbox();
  let billingCard;

  const payment_methods_no_credit_cards = Immutable.fromJS([
    {
      type: 'PurchaseOrder',
      po_reference_number: '909751',
      description: 'Atomic Lab',
      po_approved_at: '20-02-2016',
      po_limit: '20000',
      limit: '12000',
      address: {
        attention: 'Hannah',
        street: '331 Oak Street',
        street_2: '',
        city: 'CA',
        country: 'US'
      },
      expiry: '2028-07-05'
    }
  ]);

  const payment_methods_no_purchase_orders = Immutable.fromJS([
    {
      type: 'CreditCard',
      credit_card_type: 'Master Card',
      credit_card_last_4: '0125',
      credit_card_name: 'Joseph',
      expiry: '2019-06-30'
    }
  ]);

  const payment_methods = Immutable.fromJS([
    {
      type: 'CreditCard',
      credit_card_type: 'Master Card',
      credit_card_last_4: '0125',
      credit_card_name: 'Joseph',
      expiry: '2016-12-02'
    },
    {
      type: 'PurchaseOrder',
      po_reference_number: '909751',
      description: 'Atomic Lab',
      po_approved_at: '20-02-2016',
      po_limit: '20000',
      limit: '12000',
      address: {
        attention: 'Hannah',
        street: '331 Oak Street',
        street_2: '',
        city: 'CA',
        country: 'US'
      },
      expiry: '02-12-2026'
    }
  ]);

  afterEach(() => {
    sandbox.restore();
    billingCard.unmount();
  });

  it('Billing card should have add credit card and add purchase order buttons', () => {
    billingCard = shallow(
      <PaymentMethods payment_methods={payment_methods} payment_methods_loaded />
    );
    expect(billingCard.find('.billing__add')).to.have.length(2);
  });

  it('Billing card should be loading if the payment methods store is not loaded', () => {
    billingCard = shallow(
      <PaymentMethods payment_methods={payment_methods} payment_methods_loaded={false} />
    );
    expect(billingCard.find('Loading')).to.have.length(1);
  });

  it('Billing card should be loaded if the payment methods store is loaded', () => {
    billingCard = shallow(
      <PaymentMethods payment_methods={payment_methods} payment_methods_loaded />
    );
    expect(billingCard.find('Loading')).to.have.length(0);
  });

  it('When no credit cards are added, a message should be shown', () => {
    billingCard = shallow(
      <PaymentMethods payment_methods={payment_methods_no_credit_cards} payment_methods_loaded />
    );
    expect(billingCard.find('.credit-card-table').find('p').text())
      .to.be.eql('Before you launch a new run, you must add a credit card.');
  });

  it('When no purchase orders are added, a message should be shown', () => {
    billingCard = shallow(
      <PaymentMethods payment_methods={payment_methods_no_purchase_orders} payment_methods_loaded />
    );
    expect(billingCard.find('.purchase-order-table').find('p').text())
      .to.be.eql('Add a purchase order to use a payment method.');
  });

  it('Validate the expiry date format', () => {
    billingCard = mount(
      <PaymentMethods payment_methods={payment_methods} payment_methods_loaded />
    );
    let rowData = billingCard.find('.credit-card-table').find('td').map(column => column.text());
    expect(rowData[2]).to.be.eql('12/16');
    rowData = billingCard.find('.purchase-order-table').find('td').map(column => column.text());
    expect(rowData[6]).to.be.eql('02/26');
  });

  it('should have edit icon in actions for purchaseOrders', () => {
    billingCard = mount(
      <PaymentMethods payment_methods={payment_methods} payment_methods_loaded />
    );
    expect(billingCard.find('.fa-edit')).to.have.lengthOf(1);
  });

  it('action column cell should have relativeWidth', () => {
    billingCard = mount(
      <PaymentMethods payment_methods={payment_methods} payment_methods_loaded />
    );
    const table = billingCard.find('Table');
    const cols = Immutable.List(table.at(1).instance().props.children);
    const actionColumnCell = cols.get(7).props;

    expect(actionColumnCell.header).to.be.eql('Actions');
    expect(actionColumnCell.relativeWidth).not.to.be.undefined;
    expect(actionColumnCell.relativeWidth).to.be.eql(1.5);
  });

  it('should open edit modal when click on edit icon', () => {
    billingCard = mount(
      <PaymentMethods payment_methods={payment_methods} payment_methods_loaded />
    );
    const spy = sandbox.stub(ModalActions, 'openWithData');
    billingCard.find(Button).last().props().onClick();
    expect(billingCard.instance().state.modalType).to.be.eql('editpurchaseorder');
    expect(spy.calledOnce).to.be.true;
  });
});
