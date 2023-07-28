import sinon from 'sinon';
import { expect } from 'chai';
import VendorAPI from 'main/api/VendorAPI';
import NotificationActions from 'main/actions/NotificationActions';
import VendorActions from './VendorActions';

describe('VendorActions', () => {
  const sandbox = sinon.createSandbox();

  afterEach(() => {
    sandbox.restore();
  });

  it('should successfully trigger getVendorsList API', () => {
    const getCommercialVendorsStub = sandbox.stub(VendorAPI, 'getCommercialVendors').returns({
      done: (cb) => {
        cb({});
      },
      fail: () => ({})
    });

    VendorActions.getVendorsList();
    expect(getCommercialVendorsStub.calledOnce).to.be.true;
  });

  it('should display error toast message when getVendorsLists API fails', () => {
    const notificationActionsSpy = sandbox.stub(NotificationActions, 'handleError');
    const getCommercialVendorsStub = sandbox.stub(VendorAPI, 'getCommercialVendors').returns({
      fail: (cb) => {
        cb({});
      }
    });

    VendorActions.getVendorsList();
    expect(getCommercialVendorsStub.calledOnce).to.be.true;
    expect(notificationActionsSpy.calledOnce).to.be.true;
  });

});
