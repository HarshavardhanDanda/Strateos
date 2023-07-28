import React from 'react';
import { shallow } from 'enzyme';
import sinon from 'sinon';
import { expect } from 'chai';
import Immutable from 'immutable';

import AdminSubscriberStore from 'main/stores/AdminSubscriberStore';
import AdminStore from 'main/stores/AdminStore';
import SessionStore from 'main/stores/SessionStore';
import FeatureConstants from '@strateos/features';
import FeatureStore from 'main/stores/FeatureStore';
import OrganizationStore from 'main/stores/OrganizationStore';
import AdminActions from 'main/actions/AdminActions';
import PaymentMethodActions from 'main/actions/PaymentMethodActions';
import { AdminPane } from './AdminPane';

describe('AdminPane', () => {
  let component;
  const sandbox = sinon.createSandbox();
  const adminPaneProps = {
    subdomain: 'test_subdomain',
    customerOrgId: 'org13'
  };

  afterEach(() => {
    sandbox.restore();
    if (component) {
      component.unmount();
    }
  });

  it('should edit invoice provider id', () => {
    component = shallow(<AdminPane {...adminPaneProps} />);
    const invoiceProvider = component.find('InvoiceProviderIdEdit');

    expect(invoiceProvider.length).to.equal(1);
  });

  it('should make approriate api calls and render child components with correct props', () => {
    sandbox.stub(SessionStore, 'isAdmin').returns(true);
    const pmAction = sandbox.stub(PaymentMethodActions, 'loadByOrg');
    const adminActionLoadAll = sandbox.stub(AdminActions, 'loadAll');
    const adminActionLoadAllSubs = sandbox.stub(AdminActions, 'loadAllSubscribers');
    component = shallow(<AdminPane {...adminPaneProps} />);

    const grantCreditProps = component.find('GrantCredit').props();
    const createInvoiceItemModalProps = component.find('CreateInvoiceItemModal').props();
    const connectedApplyCreditModalProps = component.find('ConnectedApplyCreditModal').props();
    expect(pmAction.calledOnce).to.be.true;
    expect(pmAction.calledWithExactly(adminPaneProps.customerOrgId)).to.be.true;
    expect(adminActionLoadAll.called).to.be.true;
    expect(adminActionLoadAllSubs.called).to.be.true;

    expect(grantCreditProps.customerOrgId).to.equal(adminPaneProps.customerOrgId);
    expect(grantCreditProps.isAdmin).to.equal(true);

    expect(createInvoiceItemModalProps.customerSubdomain).to.equal(adminPaneProps.subdomain);
    expect(createInvoiceItemModalProps.isAdmin).to.equal(true);

    expect(connectedApplyCreditModalProps.customerOrgId).to.equal(adminPaneProps.customerOrgId);
    expect(connectedApplyCreditModalProps.customerSubdomain).to.equal(adminPaneProps.subdomain);
    expect(connectedApplyCreditModalProps.isAdmin).to.equal(true);
  });

  it('should render GrantCredit', () => {
    sandbox.stub(SessionStore, 'isAdmin').returns(true);
    component = shallow(<AdminPane {...adminPaneProps} />);

    expect(component.find('GrantCredit').length).to.be.equal(1);
    expect(component.find('CreateInvoiceItemModal').length).to.equal(1);
    expect(component.find('ConnectedApplyCreditModal').length).to.equal(1);
  });

  it('should render Invoice Item Modal and Credit Modal only when permission is present', () => {
    sandbox.stub(SessionStore, 'isAdmin').returns(false);
    sandbox.stub(FeatureStore, 'hasPlatformFeature').withArgs(FeatureConstants.MANAGE_INVOICES_GLOBAL).returns(true);
    component = shallow(<AdminPane {...adminPaneProps} />);

    expect(component.find('CreateInvoiceItemModal').length).to.equal(1);
    expect(component.find('ConnectedApplyCreditModal').length).to.equal(1);
  });

  it('should not render Invoice Item Modal and Credit Modal when permission is not present', () => {
    sandbox.stub(SessionStore, 'isAdmin').returns(false);
    sandbox.stub(FeatureStore, 'hasPlatformFeature').withArgs(FeatureConstants.MANAGE_INVOICES_GLOBAL).returns(false);
    component = shallow(<AdminPane {...adminPaneProps} />);

    expect(component.find('CreateInvoiceItemModalCreditModal').length).to.equal(0);
    expect(component.find('ConnectedApplyCreditModal').length).to.equal(0);
  });

  it('should update accountManager edit component select input field when org account manager is updated', () => {
    const organizationStub = sandbox.stub(OrganizationStore, 'findBySubdomain')
      .returns(Immutable.fromJS({ account_manager_or_default: { id: 'managerId' } }));
    sandbox.stub(SessionStore, 'isAdmin').returns(true);
    component = shallow(<AdminPane {...adminPaneProps} />);
    expect(component.find('AccountManagerEdit').dive().find('Select').props().value).to.equals('managerId');

    organizationStub.restore();
    sandbox.stub(OrganizationStore, 'findBySubdomain')
      .returns(Immutable.fromJS({ account_manager_or_default: { id: 'managerId1' } }));
    component.setProps({});
    expect(component.find('AccountManagerEdit').dive().find('Select').props().value).to.equals('managerId1');
  });

  it('should update invoiceProviderId edit component text input field when org customer is updated', () => {
    const organizationStub = sandbox.stub(OrganizationStore, 'findBySubdomain').returns(Immutable.fromJS({ netsuite_customer_id: 'custId' }));
    component = shallow(<AdminPane {...adminPaneProps} />);
    expect(component.find('InvoiceProviderIdEdit').dive().find('TextInput').props().value).to.equals('custId');

    organizationStub.restore();
    sandbox.stub(OrganizationStore, 'findBySubdomain').returns(Immutable.fromJS({ netsuite_customer_id: 'custId1' }));
    component.setProps({});
    expect(component.find('InvoiceProviderIdEdit').dive().find('TextInput').props().value).to.equals('custId1');
  });

  it('should update testAccount edit component input field when org test account is updated', () => {
    const organizationStub = sandbox.stub(OrganizationStore, 'findBySubdomain').returns(Immutable.fromJS({ test_account: false }));
    component = shallow(<AdminPane {...adminPaneProps} />);
    expect(component.find('TestAccountEdit').dive().find('input').props().checked).to.equals(undefined);

    organizationStub.restore();
    sandbox.stub(OrganizationStore, 'findBySubdomain').returns(Immutable.fromJS({ test_account: true }));
    component.setProps({});
    expect(component.find('TestAccountEdit').dive().find('input').props().checked).to.equals('checked');
  });

  it('should have defaultAdminId in selectedAdminId prop of subscriber edit when selectedAdminId state is empty', () => {
    sandbox.stub(AdminSubscriberStore, 'getAllBySubdomain').returns(Immutable.fromJS([{ id: 'id1' }]));
    sandbox.stub(AdminStore, 'getAll').returns(Immutable.fromJS([{ id: 'id1' }, { id: 'id2' }, { id: 'id3' }]));
    sandbox.stub(SessionStore, 'isAdmin').returns(true);
    component = shallow(<AdminPane {...adminPaneProps} />);
    expect(component.find('SubscribersEdit').props().selectedAdminId).to.equal('id2');
  });

  it('should have selectedAdminId in selectedAdminId prop of subscriber edit when selectedAdminId state is empty', () => {
    sandbox.stub(AdminSubscriberStore, 'getAllBySubdomain').returns(Immutable.fromJS([{ id: 'id1' }]));
    sandbox.stub(AdminStore, 'getAll').returns(Immutable.fromJS([{ id: 'id1' }, { id: 'id2' }, { id: 'id3' }]));
    sandbox.stub(SessionStore, 'isAdmin').returns(true);
    component = shallow(<AdminPane {...adminPaneProps} />);
    component.find('SubscribersEdit').props().onChangeSelectedAdminId('id3');
    expect(component.find('SubscribersEdit').props().selectedAdminId).to.equal('id3');
  });

  it('should have admins who are not subscribed in candidateSubscribers prop of subscriberEdit', () => {
    sandbox.stub(AdminSubscriberStore, 'getAllBySubdomain').returns(Immutable.fromJS([{ id: 'id1' }]));
    sandbox.stub(AdminStore, 'getAll').returns(Immutable.fromJS([{ id: 'id1' }, { id: 'id2' }, { id: 'id3' }]));
    sandbox.stub(SessionStore, 'isAdmin').returns(true);
    component = shallow(<AdminPane {...adminPaneProps} />);
    expect(component.find('SubscribersEdit').props().candidateSubscribers.toJS()).deep.equals([{ id: 'id2' }, { id: 'id3' }]);
  });
});
