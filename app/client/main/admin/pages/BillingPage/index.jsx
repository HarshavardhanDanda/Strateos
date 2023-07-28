import React from 'react';
import PropTypes           from 'prop-types';
import { NavLink, Link } from 'react-router-dom';

import { TabRouter, Subtabs, Breadcrumbs } from '@transcriptic/amino';
import { PageLayout, PageHeader } from 'main/components/PageLayout';
import { TabLayout } from 'main/components/TabLayout';
import BillingHistory        from 'main/admin/pages/BillingPage/billing_history';
import AdminUrls             from 'main/admin/urls.js';
import QualityControl        from 'main/admin/pages/BillingPage/quality_control';
import POApprovalsHOC        from 'main/admin/pages/BillingPage/po_approvals';
import UnpaidInvoicesHOC     from 'main/admin/pages/BillingPage/UnpaidInvoices';

export function Tabs() {
  return (
    <Subtabs>
      <NavLink
        to={`${AdminUrls.billing()}/pending_invoice`}
      >
        Pending invoices
      </NavLink>
      <NavLink
        to={`${AdminUrls.billing()}/history`}
      >
        History
      </NavLink>
      <NavLink
        to={`${AdminUrls.billing()}/quality_control`}
      >
        QC
      </NavLink>
      <NavLink
        to={`${AdminUrls.billing()}/po_approvals`}
      >
        PO approval
      </NavLink>
    </Subtabs>
  );
}

class BillingPage extends React.Component {

  static get propTypes() {
    return {
      match: PropTypes.shape({
        path: PropTypes.string.isRequired
      })
    };
  }

  render() {
    const { match } = this.props;
    return (
      <TabRouter basePath={AdminUrls.billing()} defaultTabId="pending_invoice">
        {
          () => {
            return (
              <PageLayout
                PageHeader={(
                  <PageHeader
                    titleArea={(
                      <Breadcrumbs>
                        <Link
                          to={AdminUrls.billing()}
                        >
                          Billing
                        </Link>
                      </Breadcrumbs>
                    )}
                  />
                )}
                Subtabs={<Tabs />}
              >
                <TabLayout>
                  <Choose>
                    <When condition={match.path === '/admin/billing/pending_invoice'}>
                      <UnpaidInvoicesHOC />
                    </When>
                    <When condition={match.path === '/admin/billing/history'}>
                      <BillingHistory />
                    </When>
                    <When condition={match.path === '/admin/billing/quality_control'}>
                      <QualityControl />
                    </When>
                    <When condition={match.path === '/admin/billing/po_approvals'}>
                      <POApprovalsHOC />
                    </When>
                  </Choose>
                </TabLayout>
              </PageLayout>
            );
          }}
      </TabRouter>
    );
  }
}
export default BillingPage;
