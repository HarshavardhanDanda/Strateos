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
  DateTime,
  StatusPill
} from '@transcriptic/amino';

import { TabLayout } from 'main/components/TabLayout';
import { validators, SimpleInputsValidator } from 'main/components/validation';
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

    name = name.replace(/\s\s+/g, ' ');
    const parts = name.split(' ');

    if (_.isEmpty(name)) {
      return onError;
    }

    return parts.map(part => part[0].toUpperCase());
  }

  render() {
    const profileUrl = this.props.user.get('profile_img_url');

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
          {profileUrl ?
            (
              <img
                className="user-profile__profile-pic"
                src={profileUrl}
                alt="User Profile"
              />
            )
            :
            (
              <div className="user-profile__profile-pic-placeholder">
                <span>{this.getUserInitials()}</span>
              </div>
            )
          }
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

  componentDidUpdate(prevProps) {
    if (!_.isEqual(this.props.user, prevProps.user)) {
      this.loadAllOperatedLabs();
    }
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

  getOrganizationsRoles(orgs) {
    const userId = this.props.user.get('id');

    Promise.all(orgs.map(async (org) => {
      const orgId = org.id;

      const data = {
        userIds: [userId],
        contextIds: [orgId],
        orgId: orgId
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

  render() {
    const { user } = this.props;
    return (
      <TabLayout>
        <div className="row account-layout">
          <div className="col-xs-3">
            <ProfilePicSection user={user} />
            <div className="user-profile__tags">
              {
                user.get('locked_out?') && (
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
                user.get('is_developer') && (
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
                user.get('two_factor_auth_enabled') && (
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
                    value: user.get('created_at') && (
                      <p className="user-profile__text-spacing">
                        <DateTime format="absolute-day" timestamp={user.get('created_at')} />
                      </p>
                    )
                  },
                  {
                    key: 'LAST LOGIN AT',
                    value: user.get('last_sign_in_at') && (
                      <p className="user-profile__text-spacing">
                        <DateTime format="absolute-day" timestamp={user.get('last_sign_in_at')} />
                      </p>
                    )
                  },
                  {
                    key: 'LAST LOGIN IP',
                    value: <p className="user-profile__text-spacing">{user.get('last_sign_in_ip')}</p>
                  },
                  {
                    key: 'ORGANIZATIONS',
                    value: this.renderOrganizations()
                  },
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
