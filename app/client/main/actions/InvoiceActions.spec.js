import sinon from 'sinon';
import HTTPUtil from 'main/util/HTTPUtil';
import ajax from 'main/util/ajax';
import Urls from 'main/util/urls';
import { expect } from 'chai';
import NotificationActions from 'main/actions/NotificationActions';
import InvoiceActions from './InvoiceActions';

describe('Invoice Actions', () => {
  const sandbox = sinon.createSandbox();

  afterEach(() => {
    sandbox.restore();
  });

  it('should successfully get Invoices', () => {
    const get = sandbox.stub(HTTPUtil, 'get').returns({
      done: (cb) => {
        cb([]);
        return { fail: () => ({}) };
      }
    });

    InvoiceActions.loadByOrg('transcriptic', 'org13', {});
    expect(get.calledWithExactly(Urls.get_invoices('transcriptic', 'org13'), { options: {} })).to.be.true;
  });

  it('should display error notification when fail to fetch invoices', () => {
    const mockErrorNotification = sandbox.stub(NotificationActions, 'handleError');

    sandbox.stub(HTTPUtil, 'get').returns({
      done: () => ({ fail: (cb) => cb({ responseText: '' }) })
    });

    InvoiceActions.loadByOrg('transcriptic', 'org13', {});
    expect(mockErrorNotification.calledOnce).to.be.true;
  });

  it('should make appropriate request to create invoice', () => {

    const mockInvoiceItemAPI = sandbox.stub(ajax, 'post').returns({
      done: (cb) => {
        cb([]);
        return { fail: () => ({}) };
      } });

    const params = {
      month: '2022-08',
      refernce: '2022-08',
      organization_id: 'org13',
      payment_method_id: 'pm1238382'
    };

    InvoiceActions.create(params);

    expect(mockInvoiceItemAPI.calledWithExactly('/api/v1/invoices', { data: { type: 'invoices', attributes: { ...params } } })).to.be.true;
  });

  it('should display notification when invoice is created', () => {

    sandbox.stub(ajax, 'post').returns({
      done: (cb) => {
        cb([]);
        return { fail: () => ({}) };
      } });

    const mockCreateNotification = sandbox.stub(NotificationActions, 'createNotification');

    const params = {
      month: '2022-08',
      refernce: '2022-08',
      organization_id: 'org13',
      payment_method_id: 'pm1238382'
    };

    InvoiceActions.create(params);
    expect(mockCreateNotification.calledWithExactly({
      text: 'Created Invoice'
    })).to.be.true;
  });

  it('should display error notification on failing creation of invoice', () => {
    const mockErrorNotification = sandbox.stub(NotificationActions, 'handleError');
    sandbox.stub(ajax, 'post').returns({
      done: () => ({ fail: (cb) => cb({ responseText: '' }) })
    });

    const params = {
      month: '2022-08',
      refernce: '2022-08',
      organization_id: 'org13',
      payment_method_id: 'pm1238382'
    };
    InvoiceActions.create(params);

    expect(mockErrorNotification.calledOnce).to.be.true;
  });

});
