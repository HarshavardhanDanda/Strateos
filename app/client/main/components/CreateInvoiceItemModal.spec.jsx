import React from 'react';
import { shallow } from 'enzyme';
import Immutable from 'immutable';
import sinon from 'sinon';
import { expect } from 'chai';
import InvoiceItemActions from 'main/actions/InvoiceItemActions';
import InvoiceActions from 'main/actions/InvoiceActions';
import PaymentMethodStore     from 'main/stores/PaymentMethodStore';
import CreateInvoiceItemModal from './CreateInvoiceItemModal';

describe('Create Invoice Modal', () => {
  let component;
  const sandbox = sinon.createSandbox();

  const props = {
    paymentMethods: Immutable.fromJS([{
      id: 'test'
    }]),
    isAdmin: false,
    customerSubdomain: 'test_domain'
  };

  afterEach(() => {
    sandbox.restore();
  });

  let createInvoiceItem;
  let createInvoice;

  beforeEach(() => {
    createInvoiceItem = sandbox.stub(InvoiceItemActions, 'create').returns({
      done: (cb) => {
        cb();
        return {
          fail: () => {} };
      },
    });

    createInvoice = sandbox.stub(InvoiceActions, 'create').returns({
      done: (cb) => {
        cb({ data: { id: 'test-invoice', attributes: {}, type: 'invoices' } });
        return {
          done: () => {} };
      },
    });

    sandbox.stub(PaymentMethodStore, 'getById').returns(Immutable.fromJS({ id: 'test', organization_id: 'org13' }));
  });

  it('should make a call to create invoice and invoice item if its not admin', () => {
    const fetchInvoice = sandbox.stub(InvoiceActions, 'fetchInvoices').returns({
      done: (cb) => {
        cb([{ data: [] }]);
        return {
          fail: () => {} };
      },
    });

    component = shallow(<CreateInvoiceItemModal {...props} />);
    const inputStates = {
      name: 'Test Item',
      amount: 1000,
      description: 'Test Description',
      quantity: 1,
      runCreditApplicable: false,
      autocredit: true,
      netSuiteItemId: 15
    };
    component.setState(inputStates);

    const invoiceItemPayload =  {
      invoice_id: 'test-invoice',
      name: inputStates.name,
      description: inputStates.description,
      quantity: inputStates.quantity,
      charge: inputStates.amount,
      run_credit_applicable: inputStates.runCreditApplicable,
      netsuite_item_id: inputStates.netSuiteItemId,
      autocredit: inputStates.autocredit
    };

    component.dive().props().onAccept();
    expect(fetchInvoice.calledOnce).to.be.true;
    expect(createInvoice.calledWithMatch({ payment_method_id: 'test', organization_id: 'org13' })).to.be.true;
    expect(createInvoiceItem.calledWithExactly(invoiceItemPayload)).to.be.true;
  });

  it('should make a call to create only invoice item when invoice exists if its not admin', () => {
    const fetchInvoice = sandbox.stub(InvoiceActions, 'fetchInvoices').returns({
      done: (cb) => {
        cb([{ data: [{ id: 'test-invoice-id', attributes: {}, type: 'invoices' }] }]);
        return {
          fail: () => {} };
      },
    });

    component = shallow(<CreateInvoiceItemModal {...props} />);
    const inputStates = {
      name: 'Test Item',
      amount: 1000,
      description: 'Test Description',
      quantity: 1,
      runCreditApplicable: false,
      autocredit: true,
      netSuiteItemId: 15
    };
    component.setState(inputStates);

    const invoiceItemPayload =  {
      invoice_id: 'test-invoice-id',
      name: inputStates.name,
      description: inputStates.description,
      quantity: inputStates.quantity,
      charge: inputStates.amount,
      run_credit_applicable: inputStates.runCreditApplicable,
      netsuite_item_id: inputStates.netSuiteItemId,
      autocredit: inputStates.autocredit
    };

    component.dive().props().onAccept();
    expect(fetchInvoice.calledOnce).to.be.true;
    expect(createInvoice.notCalled).to.be.true;
    expect(createInvoiceItem.calledWithExactly(invoiceItemPayload)).to.be.true;
  });
});
