import sinon from 'sinon';
import { expect } from 'chai';
import ajax from 'main/util/ajax';
import AddressActions from 'main/actions/AddressActions';
import Urls from 'main/util/urls';

describe('Address Actions', () => {
  const sandbox = sinon.createSandbox();
  afterEach(() => {
    sandbox.restore();
  });
  const customerOrgId = 'org123';
  const customerSubdomain = 'testdomain';
  const address = {
    street1: 'abc1',
    street2: 'xyz1',
    zip: '1245',
    country: 'usa'
  };

  it('should load all addresses for a given organization', () => {
    const get = sandbox.stub(ajax, 'get').returns({
      done: (cb) => {
        cb([]);
        return { fail: () => ({}) };
      }
    });
    AddressActions.loadAll(customerOrgId, customerSubdomain);
    expect(get.calledOnce);
    expect(get.calledWithExactly(Urls.org_addresses_api(customerOrgId, customerSubdomain))).to.be.true;
  });

  it('should create address for a given organization', () => {
    const post = sandbox.stub(ajax, 'post')
      .returns({
        done: (cb) => {
          cb([]);
          return { fail: () => ({}) };
        }
      });
    AddressActions.create(address, customerOrgId, customerSubdomain);
    expect(post.calledOnce);
    expect(post.calledWithExactly(Urls.org_addresses_api(customerOrgId, customerSubdomain), { address })).to.be.true;
  });

  it('should update address of a given organization', () => {
    const put = sandbox.stub(ajax, 'put')
      .returns({
        done: (cb) => {
          cb([]);
          return { fail: () => ({}) };
        }
      });
    address.id = 'ad123';
    AddressActions.update(address.id, address, customerOrgId, customerSubdomain);
    expect(put.calledOnce);
    expect(put.calledWithExactly(Urls.org_address_api(address.id, customerOrgId, customerSubdomain), { address })).to.be.true;
  });

  it('should destroy address of a given organization', () => {
    const destroy = sandbox.stub(ajax, 'delete').returns({
      done: (cb) => {
        cb([]);
        return { fail: () => ({}) };
      }
    });
    address.id = 'ad123';
    const customerOrgId = 'org123';
    AddressActions.destroy(address.id, customerOrgId, customerSubdomain);
    expect(destroy.calledOnce);
    expect(destroy.calledWithExactly(Urls.org_address_api(address.id, customerOrgId, customerSubdomain))).to.be.true;
  });
});
