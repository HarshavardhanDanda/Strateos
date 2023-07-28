import classNames from 'classnames';
import Immutable from 'immutable';
import _ from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import {
  Column,
  KeyValueList,
  Profile,
  Table,
  Toggle,
  Spinner,
  TableLayout,
  DateTime,
  StatusPill
} from '@transcriptic/amino';

import AdminUserActions from 'main/admin/actions/UserActions';
import { TabLayout } from 'main/components/TabLayout';
import { validators, SimpleInputsValidator } from 'main/components/validation';
import SessionStore from 'main/stores/SessionStore';
import LabAPI from 'main/api/LabAPI';
import LabStore from 'main/stores/LabStore';
import ajax from 'main/util/ajax';
import Urls from 'main/util/urls';

import 'react-image-crop/lib/ReactCrop.scss';
import './UserProfileView.scss';

class ProfilePicSection extends React.Component {
  static get propTypes() {
    return {
      user: PropTypes.object.isRequired
    };
  }

  getUserInitials() {
    const onError = '??';

    let name = this.props.user.get('name');

    if (!name) {
      return onError;
    }

    name        = name.replace(/\s\s+/g, ' ');
    const parts = name.split(' ');

    if (_.isEmpty(name)) {
      return onError;
    }

    return parts.map(part => part[0].toUpperCase());
  }

  render() {
    const profileUrl = this.props.user.get('profileImgUrl');

    return (
      <div className="user-profile__profile-pic-section">
        <div
          className={classNames(
            'user-profile__profile-pic-container',
            {
              'user-profile__profile-pic-container--bordered': !profileUrl
            }
          )}
        >
          <Choose>
            <When condition={profileUrl}>
              <img
                className="user-profile__profile-pic"
                src={profileUrl}
                alt="User Profile"
              />
            </When>
            <Otherwise>
              <div className="user-profile__profile-pic-placeholder">
                <span>{this.getUserInitials()}</span>
              </div>
            </Otherwise>
          </Choose>
        </div>
        <div>
          <h3 className="tx-type--heavy">{this.props.user.get('name')}</h3>
        </div>
      </div>
    );
  }
}

class ProfileView extends React.Component {

  static get propTypes() {
    return {
      user: PropTypes.object.isRequired
    };
  }

  static validator() {
    return SimpleInputsValidator({
      name: {
        validators: [validators.non_empty]
      },
      email: {
        validators: [validators.email, validators.non_empty]
      }
    });
  }

  constructor(props) {
    super(props);

    this.state = {
      featureGroups: this.getFeatureGroups(),
      spinner: false,
      orgsWithRoles: []
    };
    _.bindAll(
      this,
      'renderOrganizations',
      'renderOrgProfile',
      'getOrganizationsRoles',
      'getOrgsWithOperatedLab'
    );
  }

  componentDidMount() {
    this.loadAllOperatedLabs();
  }

  async loadAllOperatedLabs() {
    const user = this.props.user;
    const organizations = user.get('organizations');
    const orgIds = organizations.map((org) => org.get('id'));
    const orgIdsList = orgIds && orgIds.toJS().join();
    await LabAPI.indexAll({
      filters: {
        operated_by_id: orgIdsList
      }
    });
    this.getOrgsWithOperatedLab();
  }

  getOrgsWithOperatedLab() {
    const user = this.props.user;
    const organizations = user.get('organizations').toJS();
    const orgsWithLabs = [];

    organizations.forEach((org) => {
      const orgId = org.id;
      const labs = LabStore.getAll().filter(lab => lab.get('operated_by_id') === orgId);
      const operatedLabs = labs && labs.toJS();
      const orgWithLabs = Object.assign(org, { operated_labs: operatedLabs });
      orgsWithLabs.push(orgWithLabs);
    });
    this.getOrganizationsRoles(orgsWithLabs);
  }

  getFeatureGroups() {
    return this.props.user.get('featureGroups');
  }

  getOrganizationsRoles(orgs) {
    const userId = this.props.user.get('id');

    Promise.all(orgs.map(async (org) => {
      const orgId = org.id;

      const data = {
        userIds: [userId],
        contextIds: [orgId]
      };
      const roles = [];

      const labs = org.operated_labs;
      if (labs && labs.length > 0) {
        const labIds = labs.map(lab => lab.id);
        data.contextIds = [orgId].concat(labIds);
      }
      const permissionSummary = await ajax.post(Urls.permission_summary(), data);
      permissionSummary.forEach((userPermission) => {
        const roleName = userPermission.featureGroup && userPermission.featureGroup.label;
        const contextName = _.startsWith(userPermission.contextId, 'lb') ? LabStore.getById(userPermission.contextId, Immutable.fromJS({})).get('name') : undefined;
        roles.push({ roleName, contextName });
      });
      return Object.assign(org, { roles });
    })
    ).then(orgsWithRoles => this.setState({ orgsWithRoles }));
  }

  getOrgProfilePic(organization) {
    if (organization && organization.get('profilePhotoAttachmentUrl')) {
      return `/upload/url_for?key=${encodeURIComponent(
        organization.get('profilePhotoAttachmentUrl')
      )}`;
    } else {
      return '/images/gravatar.jpg';
    }
  }

  onChangeState(id, featureGroup, featureGroupState) {
    const options = { feature_group: featureGroup, feature_group_state: featureGroupState };
    this.setState({ spinner: true });
    AdminUserActions.manageFeatureGroups(id, options)
      .done(() => {
        this.setState({ spinner: false });
      })
      .fail(() => {
        if (featureGroupState === 'on') {
          const availableFeatureGroups = this.state.featureGroups.filter(feature => feature !== (featureGroup));
          this.setState({ featureGroups: availableFeatureGroups });
        } else {
          this.setState(prevState => ({ featureGroups: prevState.featureGroups.push(featureGroup) }));
        }
        this.setState({ spinner: false });
      });
  }

  manageFeatureGroups(event) {
    const id = this.props.user.get('id');
    const featureGroup = event.target.name;
    const featureGroupState = event.target.value;
    if (featureGroupState === 'on') {
      this.setState(prevState => ({ featureGroups: prevState.featureGroups.push(featureGroup) }), () => this.onChangeState(id, featureGroup, featureGroupState));
    } else {
      const availableFeatureGroups = this.state.featureGroups.filter(feature => feature !== (featureGroup));
      this.setState({ featureGroups: availableFeatureGroups }, () => this.onChangeState(id, featureGroup, featureGroupState));
    }
  }

  renderOrgProfile(org) {
    return (
      <div className="org_profile">
        <Profile
          imgSrc={this.getOrgProfilePic(org)}
          name={org.get('name')}
        />
        <div className="org_profile__name">
          {org.get('name')}
        </div>
      </div>
    );
  }

  renderUserRole(org) {
    const roles = org.get('roles');
    const rolesList = roles && roles.map(roleObj => {
      const contextName = roleObj.get('contextName');
      const roleName = roleObj.get('roleName');
      let role = roleName;
      if (contextName) {
        role = `${roleName}(${contextName})`;
      }
      return role;
    });
    return rolesList && rolesList.join(' , ');
  }

  renderOrganizations() {
    return (
      <Table
        data={Immutable.fromJS(this.state.orgsWithRoles)}
        loaded
        disabledSelection
        emptyMessage="N/A"
        id="user-organizations-table"
      >
        <Column
          renderCellContent={this.renderOrgProfile}
          header="NAME"
          id="organization-column"
          relativeWidth={1}
        />
        <Column
          renderCellContent={this.renderUserRole}
          header="ROLE"
          id="role-column"
          relativeWidth={2}
        />
      </Table>
    );
  }

  renderFeature() {
    const { Block, Body, Row, BodyCell } = TableLayout;
    const featureGroups = [
      { name: 'AutoProtocol Submission', feature: 'can_submit_autoprotocol' },
      { name: 'Notebooks', feature: 'can_view_notebooks' },
      { name: 'Pricing Breakdown', feature: 'pricing_breakdown' },
      { name: 'Upload Packages', feature: 'can_upload_packages' },
      { name: 'Delete Datasets', feature: 'can_delete_datasets' },
      { name: 'Cirrus', feature: 'cirrus' }
    ];
    return (
      <Choose>
        <When condition={this.state.spinner}>
          <Spinner />
        </When>
        <Otherwise>
          <Block toggleRowColor>
            <Body>
              {featureGroups.map(featureGroup => {
                return (
                  <Row key={featureGroup.feature}>
                    <BodyCell>
                      <div className="user-profile__feature-groups">
                        <div className="user-profile__column-width">{featureGroup.name}</div>
                        <Toggle
                          name={featureGroup.feature}
                          value={this.state.featureGroups.contains(featureGroup.feature) ? 'on' : 'off'}
                          onChange={event => this.manageFeatureGroups(event)}
                        />
                      </div>
                    </BodyCell>
                  </Row>
                );
              })}
            </Body>
          </Block>
        </Otherwise>
      </Choose>
    );
  }

  render() {
    const { user } = this.props;
    const permissions = SessionStore.getUser().get('permissions');
    const canManageUser = permissions && permissions.includes('can_manage_users');

    return (
      <TabLayout>
        <div className="row account-layout">
          <div className="col-xs-3">
            <ProfilePicSection user={user} />
            <div className="user-profile__tags">
              {
                user.get('lockedOut?') && (
                  <StatusPill
                    type="danger"
                    className="user-profile__locked-tag"
                    text={' Locked'}
                    icon="fa-lock"
                    iconType="fa"
                    shape="tag"
                  />
                )
              }
              {
                user.get('isDeveloper') && (
                  <StatusPill
                    type="action"
                    className="user-profile__developer-tag"
                    text={' Developer'}
                    icon="fa-keyboard"
                    iconType="fa"
                    shape="tag"
                  />
                )
              }
              {
                user.get('twoFactorAuthEnabled') && (
                  <StatusPill
                    type="action"
                    backgroundColor="#c9ecfd"
                    className="user-profile__developer-tag"
                    text={' 2FA Enabled'}
                    icon="fa-mobile"
                    iconType="fa"
                    shape="tag"
                  />
                )
              }
            </div>
          </div>
          <div className="col-xs-9 information-section">
            <div className="user-profile__content-header">
              <h3>Profile</h3>
            </div>
            <div className="user-profile__content-body">
              <KeyValueList
                entries={[
                  {
                    key: 'NAME',
                    value: <p className="user-profile__text-spacing">{user.get('name')}</p>
                  },
                  {
                    key: 'EMAIL ADDRESS',
                    value: <p className="user-profile__text-spacing">{user.get('email')}</p>
                  },
                  {
                    key: 'USER ID',
                    value: <p className="user-profile__text-spacing">{user.get('id')}</p>
                  },
                  {
                    key: 'JOINED',
                    value: user.get('createdAt') && (
                      <p className="user-profile__text-spacing">
                        <DateTime format="absolute-day" timestamp={user.get('createdAt')} />
                      </p>
                    )
                  },
                  {
                    key: 'LAST LOGIN AT',
                    value: user.get('lastSignInAt') && (
                      <p className="user-profile__text-spacing">
                        <DateTime format="absolute-day" timestamp={user.get('lastSignInAt')} />
                      </p>
                    )
                  },
                  {
                    key: 'LAST LOGIN IP',
                    value: <p className="user-profile__text-spacing">{user.get('lastSignInIp')}</p>
                  },
                  {
                    key: 'ORGANIZATIONS',
                    value: this.renderOrganizations()
                  },
                  !!canManageUser && {
                    key: 'FEATURE GROUPS',
                    value: this.renderFeature()
                  }
                ]}
                primaryKey
              />
            </div>
          </div>
        </div>
      </TabLayout>
    );
  }
}

export default ProfileView;
