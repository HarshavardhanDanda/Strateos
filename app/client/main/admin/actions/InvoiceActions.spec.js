import sinon from 'sinon';
import AdminUrls from 'main/admin/urls';
import Urls from 'main/util/urls';
import ajax from 'main/util/ajax';
import { expect } from 'chai';
import InvoiceActions from './InvoiceActions';

describe('Invoice Action', () => {
  const sandbox = sinon.createSandbox();

  afterEach(() => {
    sandbox.restore();
  });

  it('should make the appropriate url requests based on the presence of subdomain', () => {
    const post = sandbox.stub(ajax, 'post').returns({
      done: (cb) => {
        cb({ credit: {}, invoice: {} });
      }
    });

    const params = {
      invoiceId: 'testInvoiceId',
      creditId: 'testCreditId',
      subdomain: 'test'
    };

    const adminUrl = AdminUrls.apply_credit_to_invoice(params.invoiceId);
    const userUrl = Urls.apply_credit_to_invoice(params.subdomain, params.invoiceId);

    InvoiceActions.applyCredit(params.invoiceId, params.creditId);
    expect(post.calledOnce);
    expect(post.args[0][0]).to.equal(adminUrl);

    InvoiceActions.applyCredit(params.invoiceId, params.creditId, params.subdomain);
    expect(post.calledOnce);
    expect(post.args[1][0]).to.equal(userUrl);
  });
});
