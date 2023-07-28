import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Page, TabRouter, Subtabs, Breadcrumbs } from '@transcriptic/amino';
import ConnectToStores from 'main/containers/ConnectToStoresHOC';
import OverviewPaneHOC     from 'main/organization/OverviewPane';
import BillingPane from 'main/organization/BillingPane';
import AdminPaneHOC from 'main/organization/AdminPane';
import SecurityPaneHOC        from 'main/organization/SecurityPane';
import Urls from 'main/util/urls';
import { PageLayout, PageHeader } from 'main/components/PageLayout';
import OrganizationAPI from 'main/api/OrganizationAPI';
import OrganizationStore from 'main/stores/OrganizationStore';
import AddressesPaneHOC from 'main/organization/AddressesPane';
import TabComponent from './TabComponent';

export function Tabs({ orgId }) {
  return (
    <Subtabs>
      <NavLink
        to={`${Urls.customer_organization(orgId)}/overview`}
      >
        Overview
      </NavLink>
      <NavLink
        to={`${Urls.customer_organization(orgId)}/addresses`}
      >
        Addresses
      </NavLink>
      <NavLink
        to={`${Urls.customer_organization(orgId)}/billing`}
      >
        Billing
      </NavLink>
      <NavLink
        to={`${Urls.customer_organization(orgId)}/security`}
      >
        Security
      </NavLink>
      <NavLink
        to={`${Urls.customer_organization(orgId)}/admin`}
      >
        Admin
      </NavLink>
    </Subtabs>
  );
}

Tabs.propTypes = {
  isAdmin: PropTypes.bool
};

class CustomerOrganizationPage extends React.Component {
  static get propTypes() {
    return {
      match: PropTypes.shape({
        path: PropTypes.string.isRequired,
        params: PropTypes.shape({
          subdomain: PropTypes.string.isRequired
        })
      }),
      organization: PropTypes.instanceOf(Immutable.Map),
      canAdmin: PropTypes.bool
    };
  }

  constructor(props) {
    super(props);
    this.state = {
      orgId: undefined,
      orgName: undefined,
      subdomain: undefined
    };

  }

  componentDidMount() {
    const orgId = this.props.match.params.orgId;
    OrganizationAPI.get(orgId, {
      includes: ['collaborators', 'account_manager', 'owner']
    }).done((payLoad => {
      this.setState({
        orgId: payLoad.data.id,
        orgName: payLoad.data.attributes.name,
        subdomain: payLoad.data.attributes.subdomain
      });
    }));
  }

  render() {
    const {  match } = this.props;
    const org = OrganizationStore.getById(this.state.orgId);
    return (
      <Page title={this.state.orgName ? this.state.orgName : undefined}>
        <TabRouter basePath={`${Urls.customer_organization(match.params.orgId)}`} defaultTabId="overview">
          {
            () => {
              return (
                <PageLayout
                  PageHeader={(
                    <PageHeader
                      titleArea={(
                        <Breadcrumbs>
                          <Link
                            key="customers-page"
                            to={Urls.customers()}
                          >
                            Customers
                          </Link>
                          <Link
                            key="customer-org-id"
                            to={`${Urls.customer_organization(match.params.orgId)}`}
                          >
                            {match.params.orgId}
                          </Link>
                          <Link
                            key="overview-subtab"
                            to={`${Urls.customer_organization(match.params.orgId)}/overview`}
                          >
                            Overview
                          </Link>
                          {match.path === '/:subdomain/customers/organization/:orgId/addresses' && (
                          <Link
                            key="addresses-subtab"
                            to={`${Urls.customer_organization(match.params.orgId)}/addresses`}
                          >
                            Addresses
                          </Link>
                          )}
                          {match.path === '/:subdomain/customers/organization/:orgId/billing' && (
                          <Link
                            key="billing-subtab"
                            to={`${Urls.customer_organization(match.params.orgId)}/billing`}
                          >
                            Billing
                          </Link>
                          )}
                          {match.path === '/:subdomain/customers/organization/:orgId/security' && (
                          <Link
                            key="security-subtab"
                            to={`${Urls.customer_organization(match.params.orgId)}/security`}
                          >
                            Security
                          </Link>
                          )}
                          {match.path === '/:subdomain/customers/organization/:orgId/admin' && (
                            <Link
                              key="admin-subtab"
                              to={`${Urls.customer_organization(match.params.orgId)}/admin`}
                            >
                              Admin
                            </Link>
                          )}
                        </Breadcrumbs>
                      )}
                    />
                  )}
                  Subtabs={<Tabs orgId={match.params.orgId} />}
                >

                  {match.path === '/:subdomain/customers/organization/:orgId/overview' && this.state.orgId && (
                  <TabComponent {...{ match, organization: org }}>
                    <OverviewPaneHOC
                      subdomain={this.state.subdomain}
                      orgId={match.params.orgId}
                    />
                  </TabComponent>
                  )}
                  {match.path === '/:subdomain/customers/organization/:orgId/addresses' && this.state.orgId && (
                  <TabComponent {...{ match, organization: org }}>
                    <AddressesPaneHOC
                      subdomain={this.state.subdomain}
                      customerOrganization={org}
                    />
                  </TabComponent>
                  )}
                  {match.path === '/:subdomain/customers/organization/:orgId/security' && this.state.orgId && (
                  <TabComponent {...{ match, organization: org }}>
                    <SecurityPaneHOC
                      subdomain={this.state.subdomain}
                      customerOrgId={this.props.match.params.orgId}
                    />
                  </TabComponent>
                  )}
                  {match.path === '/:subdomain/customers/organization/:orgId/billing' && this.state.orgId && (
                  <TabComponent {...{ match, organization: org }}>
                    <BillingPane
                      subdomain={this.state.subdomain}
                      customerOrganizationId={this.props.match.params.orgId}
                    />
                  </TabComponent>
                  )}
                  { match.path === '/:subdomain/customers/organization/:orgId/admin' && this.state.orgId  && (
                  <TabComponent {...{ match, organization: org }}>
                    <AdminPaneHOC
                      subdomain={this.state.subdomain}
                      customerOrgId={this.state.orgId}
                    />
                  </TabComponent>
                  )}
                </PageLayout>
              );
            }}
        </TabRouter>
      </Page>
    );
  }
}

const ConnectedOrganizationPage = ConnectToStores(CustomerOrganizationPage, () => {});

export default ConnectedOrganizationPage;
export { CustomerOrganizationPage };
