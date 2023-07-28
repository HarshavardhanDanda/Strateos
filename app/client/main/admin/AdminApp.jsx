import PropTypes from 'prop-types';
import React     from 'react';
import { NavLink }  from 'react-router-dom';

import { Subtabs } from '@transcriptic/amino';

import AdminUrls from 'main/admin/urls';
import AdminActions from 'main/actions/AdminActions';
import Toaster from 'main/components/Toaster';
import SessionStore from 'main/stores/SessionStore';
import UserNavBar from 'main/components/UserNavBar';
// Import App CSS

import '../../../assets/stylesheets/webpackCssRoot.scss';

import '../App.scss';
import './AdminApp.scss';

const propTypes = {
  children: PropTypes.node.isRequired
};

class AdminApp extends React.Component {
  render() {
    return (
      <div
        className="admin-app main-app tx-two-element-layout"
      >
        <div className="main-app__header header-bar admin hidden-print tx-two-element-layout__header">
          <UserNavBar
            isAdmin={SessionStore.isAdmin()}
          >
            <Subtabs inverted>
              <NavLink to={AdminUrls.billing()} key="Bills">
                Bills
              </NavLink>
              <NavLink to={AdminUrls.customers()} key="Users">
                Users
              </NavLink>
            </Subtabs>
            <div className="profile">
              <div className="context">
                <div className="name">
                  {SessionStore.getUser() && SessionStore.getUser().get('name')}
                </div>
                <div id="sign-out">
                  <a onClick={AdminActions.signOut}>
                    <i className="fa fa-sign-out-alt" />
                  </a>
                </div>
              </div>
            </div>
          </UserNavBar>
        </div>
        <div className="main-page-content tx-two-element-layout__body">
          { this.props.children }
        </div>
        <Toaster />
      </div>
    );
  }
}
AdminApp.propTypes = propTypes;

export default AdminApp;
