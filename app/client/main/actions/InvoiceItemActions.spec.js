import sinon from 'sinon';
import { expect } from 'chai';
import ajax from 'main/util/ajax';
import NotificationActions from 'main/actions/NotificationActions';
import InvoiceItemActions from './InvoiceItemActions';

describe('Invoice Item Action', () => {
  const sandbox = sinon.createSandbox();

  afterEach(() => {
    sandbox.restore();
  });

  it('should make appropriate request to create invoice item', () => {

    const mockInvoiceItemAPI = sandbox.stub(ajax, 'post').returns({
      done: (cb) => {
        cb([]);
        return { fail: () => ({}) };
      } });

    const params = {
      invoice_id: 'test_id',
      name: 'test',
      description: 'test_description',
      quantity: 1,
      charge: 10,
      run_credit_applicable: false,
      netsuite_item_id: '123',
      autocredit: true
    };

    InvoiceItemActions.create(params);

    expect(mockInvoiceItemAPI.calledWithExactly('/api/invoice_items', { data: { type: 'invoice_items', attributes: { ...params } } })).to.be.true;
  });

  it('should display notification when invoice item is created', () => {

    sandbox.stub(ajax, 'post').returns({
      done: (cb) => {
        cb([]);
        return { fail: () => ({}) };
      } });

    const mockCreateNotification = sandbox.stub(NotificationActions, 'createNotification');

    const params = {
      invoice_id: 'test_id',
      name: 'test',
      description: 'test_description',
      quantity: 1,
      charge: 10,
      run_credit_applicable: false,
      netsuite_item_id: '123',
      autocredit: true
    };

    InvoiceItemActions.create(params);

    expect(mockCreateNotification.calledWithExactly({
      text: 'Created Invoice Item'
    })).to.be.true;
  });

  it('should display error notification on failing creation of invoice item', () => {
    const mockErrorNotification = sandbox.stub(NotificationActions, 'handleError');
    sandbox.stub(ajax, 'post').returns({
      done: () => ({ fail: (cb) => cb({ responseText: '' }) })
    });

    const params = {
      invoice_id: 'test_id',
      name: 'test',
      description: 'test_description',
      quantity: 1,
      charge: 10,
      run_credit_applicable: false,
      netsuite_item_id: '123',
      autocredit: true
    };

    InvoiceItemActions.create(params);

    expect(mockErrorNotification.calledOnce).to.be.true;
  });
});
