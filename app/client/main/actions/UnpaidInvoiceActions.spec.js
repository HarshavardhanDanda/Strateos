import sinon from 'sinon';
import { expect } from 'chai';
import ajax from 'main/util/ajax';
import NotificationActions from 'main/actions/NotificationActions';
import Dispatcher from 'main/dispatcher';
import Urls from 'main/util/urls';
import UnpaidInvoiceActions from './UnpaidInvoiceActions';

describe('UnpaidInvoice actions', () => {
  const sandbox = sinon.createSandbox();
  let clock, patchRequestStub, notificationActionsSpy, dispatchSpy;
  const now = new Date();

  const mockResponse = {
    data: {
      id: 'inv17kau42fpzcg',
      type: 'invoices',
      attributes: {
        charged_at: undefined,
        created_at: '2015-03-31T17:00:41.420-07:00',
        declined_at: undefined,
        forgiven_at: '2015-04-03T10:51:38.751-07:00',
        id: 'inv17kau42fpzcg',
        issued_at: undefined,
        month: '2015-03',
        organization_id: 'org16quvsyfmr29',
        payment_method_id: 'pm17hvtk7yxvnp',
        reference: '2015-03',
        remitted_at: undefined,
        total: '0.0',
        xero_invoice_guid: '483fdc39-e9eb-47da-bdb0-f3144e102a55',
        xero_invoice_number: 'INV-4333'
      }
    } };

  beforeEach(() => {
    patchRequestStub = sandbox.stub(ajax, 'patch').returns({
      done: (cb) => {
        cb(mockResponse);
        return { fail: () => ({}) };
      }
    });
    notificationActionsSpy = sandbox.stub(NotificationActions, 'createNotification');
    dispatchSpy = sandbox.stub(Dispatcher, 'dispatch');
    clock = sandbox.useFakeTimers({ now: now.getTime() });
  });

  afterEach(() => {
    sandbox.restore();
    clock.restore();
  });

  it('should remit invoices', () => {
    const expectedRequestBody = {
      data: {
        type: 'invoices',
        id: 'inv1',
        attributes: { remitted_at: now }
      }
    };
    UnpaidInvoiceActions.remit(['inv1', 'inv2']);
    expect(patchRequestStub.calledTwice);
    expect(patchRequestStub.calledWith('/api/v1/invoices/inv1')).to.be.true;
    expect(patchRequestStub.calledWith('/api/v1/invoices/inv2')).to.be.true;
    expect(patchRequestStub.getCall(0).args[1]).to.deep.equal(expectedRequestBody);
    expect(patchRequestStub.getCall(0).args[1]).to.deep.equal(expectedRequestBody);
    expect(notificationActionsSpy.calledTwice);
    expect(dispatchSpy.calledTwice);
  });

  it('should forgive invoices', () => {
    const expectedRequestBody = {
      data: {
        type: 'invoices',
        id: 'inv1',
        attributes: { forgiven_at: now }
      }
    };
    UnpaidInvoiceActions.forgive(['inv1', 'inv2']);
    expect(patchRequestStub.calledTwice);
    expect(patchRequestStub.calledWith('/api/v1/invoices/inv1')).to.be.true;
    expect(patchRequestStub.calledWith('/api/v1/invoices/inv2')).to.be.true;
    expect(patchRequestStub.getCall(0).args[1]).to.deep.equal(expectedRequestBody);
    expect(patchRequestStub.getCall(0).args[1]).to.deep.equal(expectedRequestBody);
    expect(notificationActionsSpy.calledTwice);
    expect(dispatchSpy.calledTwice);
  });

  it('should create netsuite invoice', () => {
    const postStub = sandbox.stub(ajax, 'post')
      .returns({
        done: (cb) => {
          cb([]);
          return { fail: () => ({}) };
        }
      });
    const invoiceId = 'invxpqxccm';
    UnpaidInvoiceActions.createNetsuiteInvoice(invoiceId);
    expect(postStub.calledOnce).to.be.true;
    expect(postStub.calledOnceWithExactly(Urls.generate_netsuite_invoice(invoiceId)));
  });

  it('should charge invoices', () => {
    const expectedRequestBody = {
      data: {
        type: 'invoices',
        id: 'inv1',
        attributes: { charged_at: now }
      }
    };
    UnpaidInvoiceActions.charge(['inv1', 'inv2']);
    expect(patchRequestStub.calledTwice);
    expect(patchRequestStub.calledWith('/api/v1/invoices/inv1')).to.be.true;
    expect(patchRequestStub.calledWith('/api/v1/invoices/inv2')).to.be.true;
    expect(patchRequestStub.getCall(0).args[1]).to.deep.equal(expectedRequestBody);
    expect(patchRequestStub.getCall(0).args[1]).to.deep.equal(expectedRequestBody);
    expect(notificationActionsSpy.calledTwice);
    expect(dispatchSpy.calledTwice);
  });
});
