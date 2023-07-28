import Immutable from 'immutable';
import React from 'react';
import sinon from 'sinon';
import { shallow } from 'enzyme';
import { expect } from 'chai';
import { Select } from '@transcriptic/amino';
import PaymentMethodStore   from 'main/stores/PaymentMethodStore';
import PaymentMethodSelector from 'main/components/PaymentMethodSelector';
import PaymentMethodActions from 'main/actions/PaymentMethodActions';

describe('Payment method selector', () => {
  const sandbox = sinon.createSandbox();
  const paymentMethods = [{
    id: 'pm18hjvppytqb4',
    organization_id: 'org13',
    created_at: '2015-12-29T22:02:15.650-08:00',
    type: 'PurchaseOrder',
    po_reference_number: 'test1',
    po_limit: '13041.22',
    po_approved_at: '2015-12-29T22:02:30.821-08:00',
    expiry: null,
    is_valid: true,
    description: 'test1',
    'is_default?': false,
    can_make_default: true,
    limit: '13041.22',
    'expired?': false
  },
  {
    id: 'pm18hjvppyt73872',
    organization_id: 'org13',
    created_at: '2015-12-29T22:02:15.650-08:00',
    type: 'PurchaseOrder',
    po_reference_number: 'test2',
    po_limit: '13041.22',
    po_approved_at: '2015-12-29T22:02:30.821-08:00',
    expiry: null,
    is_valid: true,
    description: 'test2',
    'is_default?': true,
    can_make_default: true,
    limit: '13041.22',
    'expired?': false
  },
  {
    id: 'pm18hhjpyt700',
    organization_id: 'org13',
    created_at: '2015-12-29T22:02:15.650-08:00',
    type: 'PurchaseOrder',
    po_reference_number: 'test3',
    po_limit: '13041.22',
    po_approved_at: '2015-12-29T22:02:30.821-08:00',
    expiry: '2017-12-29T22:02:30.821-08:00',
    is_valid: true,
    description: 'tes3',
    'is_default?': false,
    can_make_default: true,
    limit: '13041.22',
    'expired?': true
  }];

  afterEach(() => {
    sandbox.restore();
  });

  let mockOnPaymentMethodSelected;
  let mockPaymentMethodStoreGetAll;

  beforeEach(() => {
    mockOnPaymentMethodSelected = sandbox.stub();
    mockPaymentMethodStoreGetAll = sandbox.stub(PaymentMethodStore, 'getAll').returns(Immutable.fromJS(paymentMethods));
    sandbox.stub(PaymentMethodStore, 'isLoaded').returns(true);
  });

  it('should have correct options in payment method dropdown', () => {
    const paymentSelector = shallow(<PaymentMethodSelector onPaymentMethodSelected={mockOnPaymentMethodSelected} />).dive();
    const paymentMethodDropdownOptions = paymentSelector.find(Select).prop('options');
    expect(paymentMethodDropdownOptions.size).to.equal(3);
    expect(paymentMethodDropdownOptions.map(pm => pm.value)).to.deep.equal(Immutable.List([paymentMethods[0].id, paymentMethods[1].id, 'new']));
    paymentSelector.unmount();
  });

  it('should call onPaymentMethodSelected with correct paymentId', () => {
    const paymentSelector = shallow(<PaymentMethodSelector onPaymentMethodSelected={mockOnPaymentMethodSelected} />).dive();
    paymentSelector.setProps({ paymentMethodId: null });
    expect(mockOnPaymentMethodSelected.called).to.be.true;
    expect(mockOnPaymentMethodSelected.args[0][0]).to.equal(paymentMethods[1].id);
    paymentSelector.unmount();
  });

  it('should call onPaymentMethodSelected with correct paymentId when default payment method is expired', () => {
    mockPaymentMethodStoreGetAll.restore();

    // setting default payment method as expired
    const updatedPaymentMethods = [...paymentMethods];
    updatedPaymentMethods[1] = { ...paymentMethods[1], 'expired?': true };
    updatedPaymentMethods[2] = { ...paymentMethods[2], 'expired?': false };
    sandbox.stub(PaymentMethodStore, 'getAll').returns(Immutable.fromJS(updatedPaymentMethods));
    const paymentSelector = shallow(<PaymentMethodSelector onPaymentMethodSelected={mockOnPaymentMethodSelected} />).dive();
    paymentSelector.setProps({ paymentMethodId: null });
    expect(mockOnPaymentMethodSelected.called).to.be.true;
    expect(mockOnPaymentMethodSelected.args[0][0]).to.equal(updatedPaymentMethods[0].id);

    const paymentMethodDropdownOptions = paymentSelector.find(Select).prop('options');
    expect(paymentMethodDropdownOptions.size).to.equal(3);
    expect(paymentMethodDropdownOptions.map(pm => pm.value)).to.deep.equal(Immutable.List([updatedPaymentMethods[0].id, updatedPaymentMethods[2].id, 'new']));
    paymentSelector.unmount();
  });

  it('Should load by org if organizationId prop exists', () => {
    sandbox.restore();
    sandbox.stub(PaymentMethodStore, 'isLoaded').returns(false);
    const loadByOrgSpy = sandbox.spy(PaymentMethodActions, 'loadByOrg');
    const paymentSelector = shallow(<PaymentMethodSelector organizationId="test123" onPaymentMethodSelected={() => {}} />).dive();
    expect(loadByOrgSpy.calledOnce).to.be.true;
    paymentSelector.unmount();
  });

  it('Should load all if organizationId prop does not exist', () => {
    sandbox.restore();
    sandbox.stub(PaymentMethodStore, 'isLoaded').returns(false);
    const loadAllSpy = sandbox.spy(PaymentMethodActions, 'loadAll');
    const paymentSelector = shallow(<PaymentMethodSelector onPaymentMethodSelected={() => {}} />).dive();
    expect(loadAllSpy.calledOnce).to.be.true;
    paymentSelector.unmount();
  });

  it('should call onPaymentMethodSelected with organization default paymentId when payment id supplied is not valid', () => {
    const paymentSelector = shallow(<PaymentMethodSelector onPaymentMethodSelected={mockOnPaymentMethodSelected} />).dive();
    paymentSelector.setProps({ paymentMethodId: paymentMethods[2].id });
    expect(mockOnPaymentMethodSelected.called).to.be.true;
    expect(mockOnPaymentMethodSelected.args[0][0]).to.equal(paymentMethods[1].id);
    paymentSelector.unmount();
  });

});
