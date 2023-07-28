import sinon from 'sinon';
import { expect } from 'chai';
import ajax from 'main/util/ajax';
import Urls from 'main/util/urls.js';
import VendorAPI from './VendorAPI';

describe('VendorAPI', () => {
  const sandbox = sinon.createSandbox();

  afterEach(() => {
    sandbox.restore();
  });

  it('should call getCommercialVendors api', () => {
    const get = sandbox.stub(ajax, 'get').returns({
      done: (cb) => {
        cb();
        return { fail: () => ({}) };
      }
    });

    VendorAPI.getCommercialVendors();
    expect(get.calledOnce).to.be.true;
    expect(get.calledWithExactly(Urls.commercial_vendors())).to.be.true;
  });
});
