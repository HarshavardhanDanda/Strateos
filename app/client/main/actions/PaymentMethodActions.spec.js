import sinon from 'sinon';
import HTTPUtil from 'main/util/HTTPUtil';
import Urls                        from 'main/util/urls';
import ajax from 'main/util/ajax';
import { expect } from 'chai';
import PaymentMethodActions from './PaymentMethodActions';

describe('Payment Method Actions', () => {
  const sandbox = sinon.createSandbox();

  afterEach(() => {
    sandbox.restore();
  });

  it('should load payment method by org', () => {
    const data = { payment_method: { organization_id: 'test123' } };
    const getStub = sandbox.stub(HTTPUtil, 'get')
      .returns({
        done: (cb) => {
          cb([]);
          return { fail: () => ({}) };
        }
      });
    PaymentMethodActions.loadByOrg('test123', 'test');
    sinon.assert.calledWith(getStub, Urls.get_payment_methods('test'), { data: data, options: {} });
  });

  it('should load all payment methods', () => {
    const getStub = sandbox.stub(HTTPUtil, 'get')
      .returns({
        done: (cb) => {
          cb([]);
          return { fail: () => ({}) };
        }
      });
    PaymentMethodActions.loadAll();
    sinon.assert.calledWith(getStub, Urls.payment_methods(), { options: undefined });
  });

  it('should update payment method for given organization id and subdomain', () => {
    const updatedPaymentMethod = {
      alias: 'zsdf',
      po_reference_number: 'ert',
      expiry: '2024-03-04',
      po_limit: '2345',
      address_id: 'addr1fkyk6ezjtrub',
      type: 'PurchaseOrder',
      current_org: 'org16'
    };
    const update = sandbox.stub(ajax, 'patch').returns({
      done: (cb) => {
        cb([]);
        return { fail: () => ({}) };
      }
    });

    PaymentMethodActions.update('pm1', updatedPaymentMethod, 'transcriptic', 'org13');
    expect(update.calledWithExactly(Urls.org_payment_method('pm1', 'transcriptic', 'org13'), { payment_method: updatedPaymentMethod })).to.be.true;
  });

  it('should delete payment method for given organization id and subdomain', () => {
    const deleteAPI = sandbox.stub(ajax, 'delete').returns({
      done: (cb) => {
        cb([]);
        return { fail: () => ({}) };
      }
    });

    PaymentMethodActions.destroyPaymentMethod('pm1', 'transcriptic', 'org13');
    expect(deleteAPI.calledWithExactly(Urls.org_payment_method('pm1', 'transcriptic', 'org13'))).to.be.true;
  });
});
