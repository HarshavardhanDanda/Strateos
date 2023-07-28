import sinon from 'sinon';
import ajax from 'main/util/ajax';
import { expect } from 'chai';
import Urls from 'main/util/urls';
import HTTPUtil from 'main/util/HTTPUtil';
import BillingContactActions from './BillingContactActions';

describe('BillingContact Actions', () => {
  const sandbox = sinon.createSandbox();

  afterEach(() => {
    sandbox.restore();
  });

  it('should successfully get BillingContact', () => {
    const get = sandbox.stub(HTTPUtil, 'get').returns({
      done: (cb) => {
        cb([]);
        return { fail: () => ({}) };
      }
    });

    BillingContactActions.loadAll();
    expect(get.calledWithExactly(Urls.billing_contacts(), { options: {} })).to.be.true;
  });

  it('should successfully create BillingContact', () => {
    const contact = { name: 'abc', email: 'abc@gmail.com' };
    const post = sandbox.stub(ajax, 'post').returns({
      done: (cb) => {
        cb([]);
        return { fail: () => ({}) };
      }
    });

    BillingContactActions.createBillingContact(contact, 'transcriptic', 'org13');
    expect(post.calledWithExactly(Urls.customer_billing_contacts('transcriptic', 'org13'),
      { billing_contact: contact }
    )).to.be.true;
  });

  it('should successfully update BillingContact', () => {
    const contact = { name: 'abc', email: 'abc@gmail.com' };
    const put = sandbox.stub(ajax, 'put').returns({
      done: (cb) => {
        cb([]);
        return { fail: () => ({}) };
      }
    });

    BillingContactActions.updateBillingContact('bc1', contact, 'transcriptic', 'org13');
    expect(put.calledWithExactly(Urls.customer_billing_contact('bc1', 'transcriptic', 'org13'),
      { billing_contact: contact }
    )).to.be.true;
  });

  it('should successfully update BillingContact if organization id is not given', () => {
    const contact = { name: 'abcd', email: 'abc@gmail.com' };
    const put = sandbox.stub(ajax, 'put').returns({
      done: (cb) => {
        cb([]);
        return { fail: () => ({}) };
      }
    });

    BillingContactActions.updateBillingContact('bc1', contact, 'transcriptic', undefined);
    expect(put.calledWithExactly(Urls.billing_contact('bc1'),
      { billing_contact: contact }
    )).to.be.true;
  });

  it('should successfully delete BillingContact', () => {
    const deleteAPI = sandbox.stub(ajax, 'delete').returns({
      done: (cb) => {
        cb([]);
        return { fail: () => ({}) };
      }
    });

    BillingContactActions.destroy('bc1', 'transcriptic', 'org13');
    expect(deleteAPI.calledWithExactly(Urls.customer_billing_contact('bc1', 'transcriptic', 'org13'))).to.be.true;
  });
});
