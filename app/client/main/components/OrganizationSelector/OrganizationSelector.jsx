import Immutable   from 'immutable';
import PropTypes   from 'prop-types';
import React       from 'react';
import truncate    from 'underscore.string/truncate';

import Urls from 'main/util/urls';
import ColorUtils from 'main/util/ColorUtils';
import { Dismissable, Profile } from '@transcriptic/amino';
import UserProfile from 'main/components/UserProfile';
import ConnectToStores from 'main/containers/ConnectToStoresHOC';
import OrganizationActions from 'main/actions/OrganizationActions';
import UserActions from 'main/actions/UserActions';
import SessionStore from 'main/stores/SessionStore';

import './OrganizationSelector.scss';

const profilePicOrDefaultUrl = (organization) => {
  if (organization.get('profile_photo_attachment_url')) {
    return `/upload/url_for?key=${encodeURIComponent(
      organization.get('profile_photo_attachment_url')
    )}`;
  } else {
    return '/images/gravatar.jpg';
  }
};

export function OrgRow({ org, hideDismissable  }) {
  const prevOrg = Urls.org;

  // set global urls, GROSS!
  Urls.use(org.get('subdomain'));
  const orgUrl    = Urls.org;
  const orgOverviewUrl = Urls.organization_overview();
  Urls.org             = prevOrg;

  return (
    <div className="row organization-selector__org" key={org.get('id')}>
      <img
        alt="Organization Profile"
        className="organization-selector__organization-pic"
        src={profilePicOrDefaultUrl(org)}
      />
      <div className="col-xs-10 organization-selector__org-defaults">
        <div className="row organization-selector__hover">
          <div className="col-xs-8 organization-selector__org-name">
            <a
              href={orgUrl}
              className="organization-selector__anchor-tag"
              onClick={hideDismissable}
            >
              {truncate(org.get('name'), 20)}
            </a>
          </div>
          <div className="col-xs-4">
            <span className="organization-selector__org-actions">
              <a
                key="org-link"
                className="organization-selector__anchor-tag"
                href={orgOverviewUrl}
                onClick={hideDismissable}
              >
                Manage
              </a>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

OrgRow.propTypes = {
  org: PropTypes.instanceOf(Immutable.Map),
  hideDismissable: PropTypes.func
};

class OrganizationSelector extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      shouldShowDismissable: false
    };

    this.toggleDismissable = this.toggleDismissable.bind(this);
    this.hideDismissable = this.hideDismissable.bind(this);
  }

  componentWillMount() {
    return this.fetchCurrentUserOrganizationsAndCollaborators();
  }

  fetchCurrentUserOrganizationsAndCollaborators() {
    return OrganizationActions.loadAllForCurrentUser();
  }

  toggleDismissable(e) {
    e.stopPropagation();
    this.setState({ shouldShowDismissable: !this.state.shouldShowDismissable });
  }

  hideDismissable() {
    this.setState({ shouldShowDismissable: false });
  }

  render() {
    const currentOrg = this.props.currentOrg;

    const loading = !currentOrg || !this.props.organizations;
    if (loading) {
      return <div />;
    }

    return (
      <div className="organization-selector">
        <div className="organization-selector__profile">
          <Profile
            name={this.props.user.get('name')}
            imgSrc={this.props.user.get('profile_img_url')}
            bgHex={ColorUtils.generateBackgroundColor(this.props.user.get('id'))}
            onClick={this.toggleDismissable}
            profileDetailsClassName={'organization-selector__profile--details'}
            icon={'fas' + (this.state.shouldShowDismissable ? ' fa-caret-up' : ' fa-caret-down')}
            showPopover={false}
            size="medium"
            type="inverted"
            showDetails
          />
        </div>
        <Dismissable
          isOpen={this.state.shouldShowDismissable}
          hideDismissable={this.hideDismissable}
        >
          <If condition={this.state.shouldShowDismissable}>
            <div className="organization-selector__dropdown">
              <div className="organization-selector__account-actions tx-type--invert">
                <UserProfile
                  user={this.props.user}
                  to={Urls.users_edit()}
                  showDetails
                />
              </div>
              <div className="organization-selector__org-list">
                <h3 className="tx-type--invert tx-type--heavy">Currently active in</h3>
                <OrgRow
                  org={currentOrg}
                  hideDismissable={this.hideDismissable}
                />

                <h3 className="tx-type--invert tx-type--heavy organization-selector__org-header-text">My Organizations</h3>
                {this.props.organizations
                  .sortBy((org) => org.get('name').toLowerCase())
                  .filter((org) => { return org.get('id') !== currentOrg.get('id'); })
                  .map((org) => {
                    return (
                      <OrgRow
                        key={org.get('id')}
                        org={org}
                        hideDismissable={this.hideDismissable}
                      />
                    );
                  })}
              </div>
              <div className="organization-selector__logout-row">
                <a onClick={UserActions.signOut}>Sign Out</a>
              </div>
            </div>
          </If>
        </Dismissable>
      </div>
    );
  }
}

OrganizationSelector.propTypes = {
  organizations: PropTypes.instanceOf(Immutable.Iterable).isRequired,
  currentOrg: PropTypes.instanceOf(Immutable.Map),
  user: PropTypes.instanceOf(Immutable.Map)
};

const getStateFromStores = function() {

  const userImmutableMap = SessionStore.getUser();
  const user = userImmutableMap && userImmutableMap.toJS();

  const organizations = user && Immutable.fromJS(user.organizations);
  const currentOrg = SessionStore.getOrg();

  return {
    organizations,
    currentOrg
  };
};

const ConnectedOrganizationSelector = ConnectToStores(
  OrganizationSelector,
  getStateFromStores
);

export default ConnectedOrganizationSelector;
