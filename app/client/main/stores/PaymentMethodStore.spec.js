import { expect } from 'chai';
import _ from 'lodash';

import  PaymentMethodStore  from 'main/stores/PaymentMethodStore';

function mockPaymentMethod() {
  return [{ id: 'pm17nv8uxb2n23',
    created_at: '2015-04-24T15:09:49.455-07:00',
    deleted_at: null,
    payment_type: 'PurchaseOrder',
    po_approved_at: null,
    organization_id: 'org17ge3zke4cb8',
    po_attachment_url: 'uploads/432895b4-4728-47a5-b97b-0758f9988004/2013-09-14_10.11.29.jpg',
    po_invoice_address: 'Taylor Murphy',
    po_limit: '100000.0',
    po_reference_number: '13276287',
    organization: { id: 'org17ge3zke4cb8', name: 'Demo Account-Transcriptic', subdomain: 'demo-account-transcriptic' }
  },
  { id: 'pm17nv9s9y3dmr',
    created_at: '2015-04-24T15:09:49.455-07:00',
    deleted_at: null,
    payment_type: 'CreditCard',
    po_approved_at: null,
    organization_id: 'org17ge3zke4cb8',
    po_attachment_url: 'uploads/432895b4-4728-47a5-b97b-0758f9988004/2013-09-14_10.11.29.jpg',
    po_invoice_address: 'Taylor Murphy',
    po_limit: '100000.0',
    po_reference_number: '13276287',
    organization: { id: 'org17ge3zke4cb8', name: 'Demo Account-Transcriptic', subdomain: 'demo-account-transcriptic' }
  },
  { id: 'pm1e9pcx936nkux',
    created_at: '2015-04-24T15:09:49.455-07:00',
    deleted_at: null,
    payment_type: 'PurchaseOrder',
    po_approved_at: null,
    organization_id: 'org17ge3zke4cb8',
    po_attachment_url: 'uploads/432895b4-4728-47a5-b97b-0758f9988004/2013-09-14_10.11.29.jpg',
    po_invoice_address: 'Taylor Murphy',
    po_limit: '100000.0',
    po_reference_number: '13276287',
    organization: { id: 'org17ge3zke4cb8', name: 'Demo Account-Transcriptic', subdomain: 'demo-account-transcriptic' }
  }];
}

describe('PaymentMethodStore', () => {
  it('should get purchase orders based on type and approval status', () => {
    PaymentMethodStore._receiveData(mockPaymentMethod());
    const response = PaymentMethodStore.getPurchaseOrders();
    expect(response.size).to.be.equal(2);
    expect(response.getIn([0, 'payment_type'])).to.be.eq('PurchaseOrder');
    expect(response.getIn([0, 'id'])).to.be.eq('pm17nv8uxb2n23');
    expect(response.getIn([0, 'deleted_at'])).to.be.eq(null);
    expect(response.getIn([0, 'po_approved_at'])).to.be.eq(null);
    expect(response.getIn([1, 'payment_type'])).to.be.eq('PurchaseOrder');
    expect(response.getIn([1, 'id'])).to.be.eq('pm1e9pcx936nkux');
    expect(response.getIn([1, 'deleted_at'])).to.be.eq(null);
    expect(response.getIn([1, 'po_approved_at'])).to.be.eq(null);
  });
});
