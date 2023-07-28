import React from 'react';
import { mount, shallow } from 'enzyme';
import { expect } from 'chai';
import Immutable from 'immutable';
import sinon from 'sinon';
import PaymentMethodActions from 'main/actions/PaymentMethodActions';
import { PaymentInfo, PaymentInfoModal } from './PaymentInfo';

describe('PaymentInfo', () => {
  let paymentInfo;
  const sandbox = sinon.createSandbox();

  const poInfo = Immutable.fromJS({
    type: 'PurchaseOrder',
    po_reference_number: '909751',
    description: 'Atomic Lab',
    po_approved_at: '20-02-2016',
    po_limit: '20000',
    limit: '12000',
    address: {
      id: '1',
      attention: 'Hannah',
      street: '331 Oak Street',
      street_2: '',
      city: 'CA',
      country: 'US'
    },
    expiry: '2028-07-05'
  });

  afterEach(() => {
    if (paymentInfo) paymentInfo.unmount();
    if (sandbox) sandbox.restore();
  });

  it('should have empty poInfo state when there is no data prop', () => {
    paymentInfo = shallow(<PaymentInfo canPurchaseOrderUpdate={() => {}} />);
    expect(paymentInfo.instance().state.poInfo).to.be.eql({});
  });

  it('should fill poInfo state with data prop', () => {
    paymentInfo = shallow(<PaymentInfo data={poInfo} canPurchaseOrderUpdate={() => {}} />);
    expect(paymentInfo.instance().state.poInfo).to.not.eql({});
  });

  it('should have banner on submitting without uploading po document', () => {
    paymentInfo = shallow(<PaymentInfo canPurchaseOrderUpdate={() => {}} data={poInfo} modalType={'editpurchaseorder'} />);
    paymentInfo.instance().save();
    expect(paymentInfo.find('.paymentinfo__banner').length).to.equal(1);
  });

  it('should not have banner on submitting after uploading po document', () => {
    paymentInfo = shallow(<PaymentInfo canPurchaseOrderUpdate={() => {}}  data={poInfo} modalType={'editpurchaseorder'} />);
    paymentInfo.instance().setState({ poInfo: { upload_id: 'id' } });
    paymentInfo.instance().save();
    expect(paymentInfo.find('.paymentinfo__banner').length).to.equal(0);
  });

  it('PaymentInfoModal should have singlepanemodal', () => {
    paymentInfo = mount(<PaymentInfoModal modalId="1234" modalType="editpurchaseorder" />);
    expect(paymentInfo.find('ConnectedSinglePaneModal').length).to.equal(1);
  });

  it('should have Edit Purchase Order as title for PaymentInfoModal in edit mode', () => {
    paymentInfo = mount(<PaymentInfoModal modalId="1234" modalType="editpurchaseorder" />);
    const modal = paymentInfo.find('ConnectedSinglePaneModal');
    expect(modal.props().title).to.eql('Edit Purchase Order Info');
  });

  it('should have Enter Purchase Order as title for PaymentInfoModal in edit mode', () => {
    paymentInfo = mount(<PaymentInfoModal modalId="1234" modalType="purchaseorder" />);
    const modal = paymentInfo.find('ConnectedSinglePaneModal');
    expect(modal.props().title).to.eql('Enter Purchase Order Info');
  });

  it('should have large modal size for PaymentInfoModal when modalType edit/create purchase order', () => {
    paymentInfo = mount(<PaymentInfoModal modalId="1234" modalType="purchaseorder" />);
    const modal = paymentInfo.find('ConnectedSinglePaneModal');
    expect(modal.props().modalSize).to.eql('large');
  });

  it('should have medium modal size for PaymentInfoModal when modalType is creditcard', () => {
    paymentInfo = mount(<PaymentInfoModal modalId="1234" modalType="creditcard" />);
    const modal = paymentInfo.find('ConnectedSinglePaneModal');
    expect(modal.props().modalSize).to.eql('medium');
  });

  it('should have error alert message', () => {
    paymentInfo = shallow(<PaymentInfo canPurchaseOrderUpdate={() => {}} data={poInfo} modalType={'editpurchaseorder'} />);
    paymentInfo.instance().setState({ error: true });
    expect(paymentInfo.find('div').last().hasClass('alert-danger')).to.equal(true);

  });

  it('should trigger PaymentMethodActions on save action ', () => {
    paymentInfo = shallow(<PaymentInfo canPurchaseOrderUpdate={() => {}} data={poInfo} modalType={'editpurchaseorder'} />);
    paymentInfo.instance().setState({ poInfo: { upload_id: 'id' } });
    const spy = sandbox.spy(PaymentMethodActions, 'update');
    paymentInfo.instance().save();
    expect(spy.calledOnce).to.be.true;
  });

  it('should contain customer organization id as prop in purchase order info editor', () => {
    paymentInfo = shallow(<PaymentInfo canPurchaseOrderUpdate={() => {}} data={poInfo} modalType={'editpurchaseorder'} customerOrganizationId="orgabc" />);
    expect(paymentInfo.find('PurchaseOrderInfoEditor').prop('customerOrganizationId')).to.equal('orgabc');
  });
});
