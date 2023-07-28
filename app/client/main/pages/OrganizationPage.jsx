import Immutable    from 'immutable';
import PropTypes    from 'prop-types';
import React        from 'react';
import { NavLink, Link }  from 'react-router-dom';

import { Page, TabRouter, Subtabs, Breadcrumbs } from '@transcriptic/amino';
import ConnectToStores     from 'main/containers/ConnectToStoresHOC';
import AddressesPaneHOC      from 'main/organization/AddressesPane';
import AdminPaneHOC           from 'main/organization/AdminPane';
import SecurityPaneHOC        from 'main/organization/SecurityPane';
import BillingPane         from 'main/organization/BillingPane';
import OverviewPaneHOC     from 'main/organization/OverviewPane';
import SessionStore        from 'main/stores/SessionStore';
import Urls                from 'main/util/urls';
import { PageLayout, PageHeader } from 'main/components/PageLayout';
import AcsControls from 'main/util/AcsControls';
import FeatureConstants from '@strateos/features';
import AuditPage  from 'main/pages/AuditPage';
import * as AuditTrailUtil from 'main/util/AuditTrailUtil';
import TabComponent from './TabComponent';

export function Tabs({ canAdmin }) {
  return (
    <Subtabs>
      <NavLink
        to={`${Urls.organization()}/overview`}
      >
        Overview
      </NavLink>
      <NavLink
        to={`${Urls.organization()}/addresses`}
      >
        Addresses
      </NavLink>
      <If condition={canAdmin}>
        <NavLink
          to={`${Urls.organization()}/billing`}
        >
          Billing
        </NavLink>
      </If>
      <If condition={canAdmin}>
        <NavLink
          to={`${Urls.organization()}/security`}
        >
          Security
        </NavLink>
      </If>
      <If condition={AcsControls.isFeatureEnabled(FeatureConstants.VIEW_AUDIT_TRAIL) && AuditTrailUtil.auditTrailEnabledAtleastOnce()}>
        <NavLink
          to={Urls.audit()}
        >
          Audit
        </NavLink>
      </If>
      <If condition={Transcriptic.current_user.system_admin}>
        <NavLink
          to={`${Urls.organization()}/admin`}
        >
          Admin
        </NavLink>
      </If>
    </Subtabs>
  );
}

Tabs.propTypes = {
  canAdmin: PropTypes.bool
};

class OrganizationPage extends React.Component {
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

  componentDidMount() {
    this.mountStatus = true;
  }

  componentWillUnmount() {
    this.mountStatus = false;
  }

  render() {
    const { organization, canAdmin, match } = this.props;
    return (
      <Page title={organization != undefined ? organization.get('name') : undefined}>
        <TabRouter basePath={`/${this.props.match.params.subdomain}`} defaultTabId="overview">
          {
            () => {
              return (
                <PageLayout
                  PageHeader={(
                    <PageHeader
                      titleArea={(
                        <Breadcrumbs>
                          <Link
                            key="breadcrumb-project"
                            to={Urls.projects()
                            }
                          >My organization
                          </Link>
                        </Breadcrumbs>
                      )}
                    />
                  )}
                  Subtabs={<Tabs canAdmin={canAdmin} />}
                >
                  {match.path === '/:subdomain/overview' && (
                  <TabComponent {...this.props}>
                    <OverviewPaneHOC subdomain={match.params.subdomain} />
                  </TabComponent>
                  )}

                  {match.path === '/:subdomain/addresses' && (
                  <TabComponent {...this.props}>
                    <AddressesPaneHOC />
                  </TabComponent>
                  )}

                  {match.path === '/:subdomain/billing' && (
                    <TabComponent {...this.props}>
                      <BillingPane subdomain={match.params.subdomain} />
                    </TabComponent>
                  )}

                  {match.path === '/:subdomain/security' && (
                    <TabComponent {...this.props}>
                      <SecurityPaneHOC />
                    </TabComponent>
                  )}

                  {match.path === '/:subdomain/admin' && (
                    <TabComponent {...this.props}>
                      <AdminPaneHOC subdomain={match.params.subdomain} />
                    </TabComponent>
                  )}

                  {match.path === '/:subdomain/audit' && <AuditPage />}
                </PageLayout>
              );
            }}
        </TabRouter>
      </Page>
    );
  }
}

const getStateFromStores = () => {
  const organization = SessionStore.getOrg();
  const collaborators = organization != undefined ? organization.get('collaborators') : undefined;
  const canAdmin = SessionStore.canAdminCurrentOrg();
  const isLoaded = organization && collaborators;

  return {
    organization,
    collaborators,
    canAdmin,
    isLoaded
  };
};

const ConnectedOrganizationPage = ConnectToStores(OrganizationPage, getStateFromStores);

export default ConnectedOrganizationPage;
export { OrganizationPage };
