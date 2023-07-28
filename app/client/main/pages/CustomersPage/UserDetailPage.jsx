import React from 'react';
import { Link } from 'react-router-dom';

import PropTypes from 'prop-types';
import NotificationActions from 'main/actions/NotificationActions';
import { PageLayout, PageHeader } from 'main/components/PageLayout';
import ConnectToStores  from 'main/containers/ConnectToStoresHOC';
import Urls from 'main/util/urls';
import UserStore from 'main/stores/UserStore';
import ModalActions from 'main/actions/ModalActions';
import FeatureStore from 'main/stores/FeatureStore';
import FeatureConstants from '@strateos/features';

import {
  Breadcrumbs,
  Page,
  Spinner
} from '@transcriptic/amino';

import UserAPI from 'main/api/UserAPI';
import ProfileView from './UserProfileView';
import TriggerNew2FAModal from './TriggerNew2FAModal';
import Reset2FAModal from './Reset2FAModal';
import ForcePasswordResetModal from './ForcePasswordResetModal';

class UserDetailPage extends React.Component {

  componentDidMount() {
    const usersFields = [
      'created_at',
      'email',
      'feature_groups',
      'first_name',
      'is_developer',
      'last_name',
      'name',
      'profile_img_url',
      'updated_at',
      'two_factor_auth_enabled',
      'locked_out?',
      'invitation_sent_at',
      'invitation_accepted_at',
      'last_sign_in_at',
      'last_sign_in_ip',
      'organizations'
    ];

    UserAPI.get(this.props.match.params.userId, { includes: ['organizations'],
      fields: { users: usersFields }
    }).fail((...response) => NotificationActions.handleError(...response));
  }

  actions() {
    return [
      {
        text: 'Force Password Reset',
        onClick: () => { ModalActions.open(ForcePasswordResetModal.MODAL_ID); }
      },
      {
        // Used when user account is locked
        text: 'Reset 2FA attempts',
        onClick: () => { ModalActions.open(Reset2FAModal.MODAL_ID); }
      },
      {
        text: 'Trigger new 2FA Code',
        onClick: () => { ModalActions.open(TriggerNew2FAModal.MODAL_ID); }
      }
    ];
  }

  render() {

    const { user }  = this.props;
    const displayname = user ? (user.get('name') || user.get('id')) : '';

    return (
      <Page title={displayname || 'NA'}>
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
                  <Link
                    to={Urls.customer_users()}
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
              actions={FeatureStore.hasPlatformFeature(FeatureConstants.MANAGE_USERS_GLOBAL) ? this.actions() : undefined}
            />
          )}
        >
          {!user ? <Spinner /> : <ProfileView user={user} />}
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
