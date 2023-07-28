import React               from 'react';
import PropTypes           from 'prop-types';
import { NavLink, Link }   from 'react-router-dom';

import { TabRouter, Subtabs, Breadcrumbs } from '@transcriptic/amino';
import AdminUrls                           from 'main/admin/urls.js';
import { PageLayout, PageHeader }          from 'main/components/PageLayout';
import { TabLayout }                       from 'main/components/TabLayout';
import Organizations                       from './Organizations';
import Users                               from './Users';
import Admins                              from './Admins';

export function Tabs() {
  return (
    <Subtabs>
      <NavLink
        to={`${AdminUrls.customers()}/organizations`}
      >
        Organizations
      </NavLink>
      <NavLink
        to={`${AdminUrls.customers()}/users`}
      >
        Users
      </NavLink>
      <NavLink
        to={`${AdminUrls.customers()}/admins`}
      >
        Admins
      </NavLink>
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
    return (
      <TabRouter basePath={AdminUrls.customers()} defaultTabId="organizations">
        {
          () => {
            return (
              <PageLayout
                PageHeader={(
                  <PageHeader
                    titleArea={(
                      <Breadcrumbs>
                        <Link
                          to={AdminUrls.customers()}
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
                  <Choose>
                    <When condition={match.path === '/admin/customers/organizations'}>
                      <Organizations />
                    </When>
                    <When condition={match.path === '/admin/customers/users'}>
                      <Users />
                    </When>
                    <When condition={match.path === '/admin/customers/admins'}>
                      <Admins />
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

export default CustomersPage;
