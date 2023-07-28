import sinon from 'sinon';
import { expect } from 'chai';
import PaymentMethodAPI from 'main/api/PaymentMethodAPI';

describe('PaymentMethodAPI', () => {
  const sandbox = sinon.createSandbox();

  const mockResponse = {
    id: 'pm17nv9s9y3dmr',
    type: 'payment_methods',
    attributes: {
      created_at: '2015-04-24T15:09:49.455-07:00',
      deleted_at: null,
      payment_type: 'CreditCard',
      po_approved_at: null,
      organization_id: 'org17ge3zke4cb8',
      po_attachment_url: 'uploads/432895b4-4728-47a5-b97b-0758f9988004/2013-09-14_10.11.29.jpg',
      po_invoice_address: 'Taylor Murphy',
      po_limit: '100000.0',
      po_reference_number: '13276287'
    },
  };

  afterEach(() => {
    sandbox.restore();
  });

  it('should call get api', () => {
    const indexAllStub = sandbox.stub(PaymentMethodAPI, 'indexAll')
      .withArgs({ filters: { type: 'PurchaseOrder', approved: false },
        version: 'v1',
        includes: ['address', 'organization'],
        fields: { organizations: ['id', 'name', 'subdomain'] },
      }).returns({
        done: (cb) => {
          cb(mockResponse);
          return { fail: () => ({}) };
        }
      });
    PaymentMethodAPI.indexAll({ filters: { type: 'PurchaseOrder', approved: false },
      version: 'v1',
      includes: ['address', 'organization'],
      fields: { organizations: ['id', 'name', 'subdomain'] },
    });
    expect(indexAllStub.calledOnce);
    expect(indexAllStub.calledWithExactly({ filters: { type: 'PurchaseOrder', approved: false },
      version: 'v1',
      includes: ['address', 'organization'],
      fields: { organizations: ['id', 'name', 'subdomain'] },
    })).to.be.true;
  });
});
