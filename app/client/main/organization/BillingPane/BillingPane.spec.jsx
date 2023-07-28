import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';
import sinon from 'sinon';
import Immutable from 'immutable';
import { Card } from '@transcriptic/amino';
import FeatureConstants from '@strateos/features';
import FeatureStore from 'main/stores/FeatureStore';
import InvoiceStore from 'main/stores/InvoiceStore';
import InvoiceActions from 'main/actions/InvoiceActions';
import { BillingPane, invoiceMonthOptions } from './BillingPane';

describe('BillingPane', () => {
  const sandbox = sinon.createSandbox();
  let billingPane;
  const subdomain = 'test_organization';

  const props = {
    customerOrganizationId: 'test_organization',
  };

  afterEach(() => {
    sandbox.restore();
    billingPane.unmount();
  });

  function mount(props) {
    billingPane = shallow(
      <BillingPane subdomain={subdomain} billingContacts={Immutable.Iterable()} {...props} />
    );
  }

  it('billing pane should have 3 different cards when permission is present', () => {
    sandbox.stub(FeatureStore, 'hasPlatformFeature').withArgs(FeatureConstants.VIEW_INVOICES_GLOBAL).returns(true);
    mount();
    const cards = billingPane.find(Card);
    expect(cards).to.have.length(3);
  });

  it('billing pane should render payment methods', () => {
    mount();
    expect(billingPane.find('ConnectedPaymentMethods')).to.have.length(1);
  });

  it('billing pane should render billing contacts', () => {
    mount();
    expect(billingPane.find('BillingContacts')).to.have.length(1);
  });

  it('billing pane should render credits', () => {
    mount();
    expect(billingPane.find('ConnectedCredits')).to.have.length(1);
  });

  it('billing pane should render invoices if permission is present', () => {
    sandbox.stub(FeatureStore, 'hasPlatformFeature').withArgs(FeatureConstants.VIEW_INVOICES_GLOBAL).returns(true);
    const loadInvoices = sandbox.spy(InvoiceActions, 'loadAll');
    mount();
    expect(billingPane.find('Invoices')).to.have.length(1);
    expect(loadInvoices.calledOnce).to.be.true;
  });

  it('billing pane should render payment methods when props is passed', () => {
    mount(props);
    expect(billingPane.find('ConnectedPaymentMethods')).to.have.length(1);
  });

  it('billing pane should render billing contacts when props is passed', () => {
    mount(props);
    expect(billingPane.find('BillingContacts')).to.have.length(1);
  });

  it('billing pane should render credits when customerOrganizationId prop is passed', () => {
    mount(props);
    expect(billingPane.find('ConnectedCredits')).to.have.length(1);
  });

  it('billing pane should render invoices when customerOrganizationId prop is passed and permission is present', () => {
    sandbox.stub(FeatureStore, 'hasPlatformFeature').withArgs(FeatureConstants.VIEW_INVOICES_GLOBAL).returns(true);
    const loadInvoices = sandbox.spy(InvoiceActions, 'loadByOrg');
    mount(props);
    expect(billingPane.find('Invoices')).to.have.length(1);
    expect(loadInvoices.calledOnce).to.be.true;
  });

  it('should compute invoices months options', () => {
    sandbox.stub(InvoiceStore, 'getAvailableMonths').returns(Immutable.Set([
      '2020-03',
      '2020-02',
      '2019-08'
    ]));

    const options = invoiceMonthOptions();

    expect(options).to.deep.equal([
      { name: 'Select Invoice Month', value: 'selection', disabled: true },
      { name: 'March, 2020', value: '2020-03' },
      { name: 'February, 2020', value: '2020-02' },
      { name: 'August, 2019', value: '2019-08' }
    ]);
  });
});
