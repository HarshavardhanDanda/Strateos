import PropTypes from 'prop-types';
import React from 'react';
import { Link } from 'react-router-dom';

import { PageLayout, PageHeader } from 'main/components/PageLayout';
import ConnectToStores  from 'main/containers/ConnectToStoresHOC';
import UserStore from 'main/stores/UserStore';
import AdminUserActions from 'main/admin/actions/UserActions';
import AdminUrls from 'main/admin/urls';
import ModalActions from 'main/actions/ModalActions';
import SessionStore from 'main/stores/SessionStore';

import {
  Breadcrumbs,
  Page,
  Spinner
} from '@transcriptic/amino';

import ProfileView from './UserProfileView';
import Reset2FAModal from './Reset2FAModal';
import TriggerNew2FAModal from './TriggerNew2FAModal';
import ForcePasswordResetModal from './ForcePasswordResetModal';

class UserDetailPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      failed: false
    };
  }

  componentDidMount() {
    this.fetchData();
  }

  componentDidUpdate() {
    this.fetchData();
  }

  async fetchData() {
    try {
      if (!this.props.user && !this.state.failed) {
        await AdminUserActions.load(this.props.match.params.userId);
      }
    } catch (err) {
      this.setState({ failed: err || true });
    }
  }

  render() {

    const { user } = this.props;

    const displayname = user ? (user.get('name') || user.get('id')) : '';
    const isLocked = user && user.get('lockedOut?');
    const permissions = SessionStore.getUser().get('permissions');
    const canManageUsers = permissions && permissions.includes('can_manage_users');

    return (
      <Page title={displayname || 'NA'}>
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
                  <Link
                    to={AdminUrls.customer_users()}
                  >
                    Users
                  </Link>
                  <Link
                    to={this.props.match.params.userId}
                  >
                    { displayname }
                  </Link>
                </Breadcrumbs>
              )}
              primaryInfoArea=""
              actions={[
                {
                  text: 'Force Password Reset',
                  disabled: !canManageUsers,
                  onClick: () => { ModalActions.open(ForcePasswordResetModal.MODAL_ID); }
                },
                {
                  // this action can be seen only if user is locked and
                  // admin has permission to reset 2fa of user.
                  text: 'Reset 2FA attempts',
                  disabled: !(isLocked && canManageUsers),
                  onClick: () => { ModalActions.open(Reset2FAModal.MODAL_ID); }
                },
                {
                  text: 'Trigger new 2FA Code',
                  disabled: !canManageUsers,
                  onClick: () => { ModalActions.open(TriggerNew2FAModal.MODAL_ID); }
                },
                {
                  text: 'Lock account'
                },
                {
                  text: 'Grant Developer Access'
                }
              ]}
            />
          )}
        >
          <Choose>
            <When condition={!user}>
              <Spinner />
            </When>
            <Otherwise>
              <ProfileView user={user} />
            </Otherwise>
          </Choose>
        </PageLayout>
        { user && [
          <Reset2FAModal key="reset-2fa-modal" user={user} />,
          <ForcePasswordResetModal key="force-password-reset-modal" user={user} />,
          <TriggerNew2FAModal key="trigger-new-2fa-modal" user={user} />,
        ]}
      </Page>
    );
  }
}

UserDetailPage.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      userId: PropTypes.string
    })
  }),
  user: PropTypes.any
};

export default ConnectToStores(UserDetailPage, (props) => {
  const user = UserStore.getById(props.match.params.userId);
  return { user };
});
