import Immutable         from 'immutable';
import _                 from 'lodash';
import PropTypes         from 'prop-types';
import React             from 'react';
import { Route, Switch, NavLink } from 'react-router-dom';

import { Page, Spinner, Subtabs, TabRouter, Breadcrumbs } from '@transcriptic/amino';
import UserActions                           from 'main/actions/UserActions';
import { PageLayout, PageHeader }            from 'main/components/PageLayout';
import ConnectToStores                       from 'main/containers/ConnectToStoresHOC';
import SessionStore                          from 'main/stores/SessionStore';
import Urls                                  from 'main/util/urls';

import DeveloperView    from './views/DeveloperView';
import NotificationView from './views/NotificationView';
import ProfileView      from './views/ProfileView';
import SecurityView     from './views/SecurityView';

import './UserPage.scss';

class UserPage extends React.Component {

  static get propTypes() {
    return {
      user: PropTypes.instanceOf(Immutable.Map)
    };
  }

  constructor(props) {
    super(props);

    this.state = {
      statusCode: undefined
    };
  }

  componentWillMount() {
    UserActions.loadCurrentUser()
      .fail(xhr => this.setState({ statusCode: xhr.status }));
  }

  render() {
    const { user } = this.props;
    return (
      <Page title="My Account" statusCode={this.state.statusCode}>
        <Choose>
          <When condition={!user}>
            <Spinner />
          </When>
          <Otherwise>
            <TabRouter basePath="/users/edit" defaultTabId="profile">
              {
                () => {
                  return (
                    <PageLayout
                      PageHeader={(
                        <PageHeader
                          titleArea={(
                            <Breadcrumbs>
                              <span>My account</span>
                            </Breadcrumbs>
                          )}
                        />
                      )}
                      Subtabs={(
                        <Subtabs>
                          <NavLink to={`${Urls.users_edit()}/profile`} key="profile">
                            Profile
                          </NavLink>
                          <NavLink to={`${Urls.users_edit()}/security`} key="security">
                            Security
                          </NavLink>
                          <NavLink to={`${Urls.users_edit()}/notifications`} key="notifications">
                            Notifications
                          </NavLink>
                          <NavLink to={`${Urls.users_edit()}/developer`} key="developer">
                            Developer
                          </NavLink>
                        </Subtabs>
                      )}
                      Modals={[]}
                    >
                      <Switch>
                        <Route
                          exact
                          path="/users/edit/profile"
                          render={() => {
                            return (
                              <ProfileView user={user} />
                            );
                          }}
                        />
                      </Switch>
                      <Switch>
                        <Route
                          exact
                          path="/users/edit/security"
                          render={() => {
                            return (
                              <SecurityView user={user} />
                            );
                          }}
                        />
                      </Switch>
                      <Switch>
                        <Route
                          exact
                          path="/users/edit/notifications"
                          render={() => {
                            return (
                              <NotificationView user={user} />
                            );
                          }}
                        />
                      </Switch>
                      <Switch>
                        <Route
                          exact
                          path="/users/edit/developer"
                          render={() => {
                            return (
                              <DeveloperView user={user} />
                            );
                          }}
                        />
                      </Switch>
                    </PageLayout>
                  );
                }
              }
            </TabRouter>
          </Otherwise>
        </Choose>
      </Page>
    );
  }
}

const getStateFromStores = () => {
  return {
    user: SessionStore.getUser()
  };
};

export default ConnectToStores(UserPage, getStateFromStores);
