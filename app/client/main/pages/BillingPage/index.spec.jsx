import React from 'react';
import { expect } from 'chai';
import { shallow, mount } from 'enzyme';
import { TabRouter } from '@transcriptic/amino';
import { BrowserRouter as Router } from 'react-router-dom';

import { TabLayout } from 'main/components/TabLayout';
import Urls from 'main/util/urls';
import UnpaidInvoicesHOC from 'main/pages/BillingPage/UnpaidInvoices';
import BillingHistory from 'main/pages/BillingPage/BillingHistory';
import POApprovalsHOC from 'main/pages/BillingPage/PoApproval';
import QualityControl from 'main/pages/BillingPage/QualityControl';
import BillingPage from '.';

const routeProps = {
  match: {
    path: ''
  }
};

describe('BillingPage', () => {

  it('should have a TabRouter', () => {
    const ref = shallow(
      <BillingPage {...routeProps} />
    );
    const tabRouter = ref.find(TabRouter);
    expect(tabRouter.length).to.be.eql(1);
  });

  it('should have Pending invoices tab as a default tab', () => {
    Urls.use('strateos');
    routeProps.match.path = Urls.pending_invoices();
    const ref = shallow(
      <BillingPage {...routeProps} />
    );
    const tabRouter = ref.find(TabRouter);
    expect(tabRouter.prop('defaultTabId')).to.be.eql('pending_invoice');
  });

  it('should have 4 tabs', () => {
    Urls.use('strateos');
    const ref = mount(<Router><BillingPage {...routeProps} /></Router>);
    const tabs = ref.find('li').map(tab => tab.text());

    expect(tabs.length).to.eql(4);
    expect(tabs[0]).to.eql('Pending invoices');
    expect(tabs[1]).to.eql('History');
    expect(tabs[2]).to.eql('QC');
    expect(tabs[3]).to.eql('PO Approval');
  });

  it('should show history page when history tab is clicked', () => {
    Urls.use('strateos');
    routeProps.match.path = Urls.history();
    const ref = mount(<Router><BillingPage {...routeProps} /></Router>);
    expect(ref.find(TabLayout).find(BillingHistory)).to.have.lengthOf(1);
  });

  it('should show QC page when QC tab is clicked', () => {
    Urls.use('strateos');
    routeProps.match.path = Urls.quality_control();
    const ref = mount(<Router><BillingPage {...routeProps} /></Router>);
    expect(ref.find(TabLayout).find(QualityControl)).to.have.lengthOf(1);
  });

  it('should show Pending invoices page when Pending invoices tab is clicked', () => {
    Urls.use('strateos');
    routeProps.match.path = Urls.pending_invoices();
    const ref = mount(<Router><BillingPage {...routeProps} /></Router>);
    expect(ref.find(TabLayout).find(UnpaidInvoicesHOC)).to.have.lengthOf(1);
  });

  it('should show PO Approval page when PO Approval tab is clicked', () => {
    Urls.use('strateos');
    routeProps.match.path = Urls.po_approval();
    const ref = mount(<Router><BillingPage {...routeProps} /></Router>);
    expect(ref.find(TabLayout).find(POApprovalsHOC)).to.have.lengthOf(1);
  });
});
