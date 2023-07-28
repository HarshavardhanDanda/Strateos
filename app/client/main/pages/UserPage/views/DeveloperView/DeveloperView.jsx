import _         from 'lodash';
import PropTypes from 'prop-types';
import React     from 'react';

import { KeyValueList, Button, DateTime } from '@transcriptic/amino';

import UserActions     from 'main/actions/UserActions';
import { TabLayout }   from 'main/components/TabLayout';
import Header from '../../components/Header';

class DeveloperView extends React.Component {

  static get propTypes() {
    return {
      user: PropTypes.object.isRequired
    };
  }

  constructor(props) {
    super(props);
    this.onRotateKey = this.onRotateKey.bind(this);
  }

  formatDate(timestamp) {
    return <DateTime timestamp={(timestamp)} />;
  }

  requestDeveloperAccess() {
    const id = this.props.user.get('id');
    UserActions.requestDeveloperAccess(id);
  }

  onRotateKey(e) {
    e.preventDefault();
    if (confirm('Are you sure?')) {
      UserActions.rotateAPIKey(this.props.user.get('id'));
    }
  }

  getEntries() {
    const { user } = this.props;
    const entries = [{ key: 'developer access' }];
    if (user.get('is_developer')) {
      entries[0].value = this.renderIsDeveloper();
    } else if (user.get('requested_developer_access_at')) {
      entries[0].value = this.renderRequested();
    } else {
      entries[0].value = this.renderIsntDeveloper();
    }
    if (user.get('is_developer')) {
      entries[1] = {
        key: 'api key',
        value: (
          <div className="user-page__api">
            <p className="user-page__api-key monospace">
              { this.props.user.get('authentication_token') }
            </p>
            <a onClick={this.onRotateKey}>
              Revoke and generate a new one.
            </a>
          </div>
        )
      };
    }
    return entries;
  }

  renderIsDeveloper() {
    const grantedAt = this.props.user.get('developer_access_granted_at')
      ? ` on ${this.formatDate(this.props.user.get('developer_access_granted_at'))}`
      : '';
    return (
      <div>
        <p className="user-page__developer-status--approved">Access Request Approved</p>
        <p className="user-page__developer-summary">
          Your Developer Access request was approved{grantedAt}.
          This gives you the ability to write your own protocols using Autoprotocol
          and access to specialized debugging tools.
        </p>
      </div>
    );
  }

  renderRequested() {
    const requestedDate = this.formatDate(this.props.user.requestedAt);
    return (
      <div>
        <p className="user-page__developer-status--requested">Access Request Pending</p>
        <p className="user-page__developer-summary">
          We received your Developer Access request on {requestedDate}.  A
          Transcriptic representative will be in contact with you shortly
          regarding your request, typically within 1 business day.
        </p>
      </div>
    );
  }

  renderIsntDeveloper() {
    return (
      <div>
        <div className="user-page__request-button">
          <Button
            type="action"
            size="large"
            onClick={this.requestDeveloperAccess()}
          >
            Request Developer Access
          </Button>
        </div>
        <p className="user-page__developer-summary">
          <span>Developer access gives you the ability write your own protocols using </span>
          <a href="http://www.autoprotocol.org">Autoprotocol</a> and access to
          specialized debugging tools.
        </p>
      </div>
    );
  }

  render() {
    return (
      <TabLayout>
        <div className="account-layout">
          <div className="information-section">
            <Header
              title="Developer"
              showIcon={false}
            />
            <div className="user-page__content-body">
              <KeyValueList entries={this.getEntries()} />
            </div>
          </div>
        </div>
      </TabLayout>
    );
  }

}

export default DeveloperView;
