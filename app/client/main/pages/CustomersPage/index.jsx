import React               from 'react';
import PropTypes           from 'prop-types';
import { NavLink, Link }   from 'react-router-dom';

import { TabRouter, Subtabs, Breadcrumbs } from '@transcriptic/amino';
import Urls from 'main/util/urls';
import { PageLayout, PageHeader } from 'main/components/PageLayout';
import { TabLayout } from 'main/components/TabLayout';
import Users from 'main/pages/CustomersPage/Users';
import FeatureStore from 'main/stores/FeatureStore';
import FeatureConstants from '@strateos/features';
import Organizations from './Organizations';

export function Tabs() {
  return (
    <Subtabs>
      { FeatureStore.hasPlatformFeature(FeatureConstants.MANAGE_ORGS_GLOBAL) && (
      <NavLink
        to={Urls.customer_organizations()}
      >
        Organizations
      </NavLink>
      )
      }
      {FeatureStore.hasPlatformFeature(FeatureConstants.VIEW_USERS_GLOBAL) && (
      <NavLink
        to={Urls.customer_users()}
      >
        Users
      </NavLink>
      )}
    </Subtabs>
  );
}

class CustomersPage extends React.Component {

  static get propTypes() {
    return {
      match: PropTypes.shape({
        path: PropTypes.string.isRequired
      })
    };
  }

  render() {
    const { match } = this.props;
    const defaultTab = FeatureStore.hasPlatformFeature(FeatureConstants.MANAGE_ORGS_GLOBAL) ? 'organizations' : 'users';
    return (
      <TabRouter basePath={Urls.customers()} defaultTabId={defaultTab}>
        {
          () => {
            return (
              <PageLayout
                PageHeader={(
                  <PageHeader
                    titleArea={(
                      <Breadcrumbs>
                        <Link
                          to={Urls.customers()}
                        >
                          Customers
                        </Link>
                      </Breadcrumbs>
                    )}
                  />
                )}
                Subtabs={<Tabs />}
              >
                <TabLayout>
                  {match.path === '/:subdomain/customers/organizations' &&
                   FeatureStore.hasPlatformFeature(FeatureConstants.MANAGE_ORGS_GLOBAL)
                   && <Organizations />}
                  {match.path === '/:subdomain/customers/users' && <Users />}
                </TabLayout>
              </PageLayout>
            );
          }}
      </TabRouter>
    );
  }
}

export default CustomersPage;
