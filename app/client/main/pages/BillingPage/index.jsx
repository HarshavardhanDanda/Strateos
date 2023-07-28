import React from 'react';
import PropTypes from 'prop-types';
import { NavLink, Link } from 'react-router-dom';
import { TabRouter, Subtabs, Breadcrumbs } from '@transcriptic/amino';
import { PageLayout, PageHeader } from 'main/components/PageLayout';
import { TabLayout } from 'main/components/TabLayout';
import UnpaidInvoicesHOC from 'main/pages/BillingPage/UnpaidInvoices';
import BillingHistory from 'main/pages/BillingPage/BillingHistory';
import POApprovalsHOC from 'main/pages/BillingPage/PoApproval';
import QualityControl from 'main/pages/BillingPage/QualityControl';
import Urls from 'main/util/urls.js';

export function Tabs() {
  return (
    <Subtabs>

      <NavLink
        to={Urls.pending_invoices()}
      >
        Pending invoices
      </NavLink>

      <NavLink
        to={Urls.history()}
      >
        History
      </NavLink>
      <NavLink
        to={Urls.quality_control()}
      >
        QC
      </NavLink>
      <NavLink
        to={Urls.po_approval()}
      >
        PO Approval
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
      <TabRouter basePath={Urls.billing()} defaultTabId="pending_invoice">
        {
          () => {
            return (
              <PageLayout
                PageHeader={(
                  <PageHeader
                    titleArea={(
                      <Breadcrumbs>
                        <Link
                          to={Urls.billing()}
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
                  {match.path === Urls.history() && <BillingHistory />}
                  {match.path === Urls.quality_control() && <QualityControl />}
                  {match.path === Urls.pending_invoices() && <UnpaidInvoicesHOC />}
                  {match.path === Urls.po_approval() && <POApprovalsHOC />}
                </TabLayout>
              </PageLayout>
            );
          }}
      </TabRouter>
    );
  }
}
export default BillingPage;
