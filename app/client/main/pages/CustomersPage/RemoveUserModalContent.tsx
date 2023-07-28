import _ from 'lodash';
import React, { useState, useEffect } from 'react';
import Immutable from 'immutable';
import { Banner, Profile, Table, Column, TextTitle, Tooltip, Icon } from '@transcriptic/amino';

import LabStore from 'main/stores/LabStore';
import LabAPI from 'main/api/LabAPI';
import ColorUtils from 'main/util/ColorUtils';
import Urls from 'main/util/urls';
import ajax from 'main/util/ajax';
import UserStore from 'main/stores/UserStore';
import UserAPI from 'main/api/UserAPI';
import NotificationActions from 'main/actions/NotificationActions';

import './RemoveUserModal.scss';

interface Props {
  data?: Immutable.Map<string, string | Immutable.List<string>>;
  selected?: Function;
}

function RemoveUserModalContent(props: Props) {
  const [orgsWithRoles, setOrgsWithRoles] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [selected, setSelected] = useState({});
  const [nonRemovableOrgs, setNonRemovableOrgs] = useState([]);
  const [nonRemovableOrgNames, setNonRemovableOrgNames] = useState([]);
  const [orgsWithAdminRole, setOrgsWithAdminRole] = useState([]);

  useEffect(() => {
    UserAPI.get(props.data.get('id'), { includes: ['organizations']
    }).done(() => {
      loadAllOperatedLabs();
    }).fail((...response) => NotificationActions.handleError(...response));
  }, []);

  useEffect(() => {
    orgsWithRoles.length > 0 && getInitialSelectedOrganization();
  }, [orgsWithRoles]);

  useEffect(() => {
    Object.keys(selected).length >= 0 && props.selected(selected, props.data.get('id'));
  }, [selected]);

  const loadAllOperatedLabs = () => {
    const user = UserStore.getById(props.data.get('id'));
    const organizations = user.get('organizations');
    const orgIds = organizations.map((org) => org.get('id'));
    const orgIdsList = orgIds && orgIds.toJS().join();
    LabAPI.indexAll({
      filters: {
        operated_by_id: orgIdsList
      }
    }).done(() => {
      getOrgsWithOperatedLab();
    });
  };

  const getOrgsWithOperatedLab = () => {
    const user = UserStore.getById(props.data.get('id'));
    const organizations = user.get('organizations').toJS();
    const orgsWithLabs = organizations.map((org) => {
      const orgId = org.id;
      const labs = LabStore.getAll().filter(lab => lab.get('operated_by_id') === orgId);
      const operatedLabs = labs && labs.toJS();
      return Object.assign(org, { operated_labs: operatedLabs });
    });
    getOrganizationsRoles(orgsWithLabs);
  };

  const getOrganizationsRoles = (orgs) => {
    const userId = props.data.get('id');
    Promise.all(orgs.map(async (org) => {
      const orgId = org.id;

      const data = {
        userIds: [userId],
        contextIds: [orgId],
        orgId: orgId
      };
      const dataWithFeatureCode = {
        contextIds: [orgId],
        orgId: orgId,
        featureCode: 'ADMINISTRATION'
      };
      const labs = org.operated_labs;
      if (labs && labs.length > 0) {
        const labIds = labs.map(lab => lab.id);
        data.contextIds = [orgId].concat(labIds);
        dataWithFeatureCode.contextIds = [orgId].concat(labIds);
      }

      const permissionSummary = await ajax.post(Urls.permission_summary(), data);
      const usersWithAdminFeature = await ajax.post(Urls.permission_summary(), dataWithFeatureCode);
      const roles = permissionSummary.map((userPermission) => {
        const roleName = userPermission.featureGroup && userPermission.featureGroup.label;
        const contextName = _.startsWith(userPermission.contextId, 'lb') ? LabStore.getById(userPermission.contextId, Immutable.fromJS({})).get('name') : undefined;
        return { roleName, contextName };
      });
      if (usersWithAdminFeature.length === 1 && usersWithAdminFeature[0].userId === userId) {
        const obj = {
          roleName: 'Sole Admin',
          contextName: undefined
        };
        roles.push(obj);
      }
      if (org.owner_id === userId) {
        const obj = {
          roleName: 'Owner',
          contextName: undefined
        };
        roles.push(obj);
      }
      return Object.assign(org, { roles });
    })
    ).then(orgsWithRoles => { setOrgsWithRoles(orgsWithRoles); setLoaded(true); });
  };

  const getInitialSelectedOrganization = () => {
    const selected = {};
    const nonRemovableOrgs = [];
    const nonRemovableOrgNames = [];
    const orgsWithAdminRole = [];
    orgsWithRoles && Immutable.fromJS(orgsWithRoles).forEach(org => {
      const roles = org.get('roles');
      const rolesList = getRolesWithContextName(roles);
      if (!(rolesList.contains('Owner') || rolesList.contains('Sole Admin'))) {
        selected[org.get('id')] = true;
      } else {
        nonRemovableOrgs.push(org.get('id'));
        nonRemovableOrgNames.push(org.get('name'));
      }
      if (rolesList.contains('Admin')) {
        orgsWithAdminRole.push(org.get('id'));
      }
    });
    setSelected(selected);
    setNonRemovableOrgs(nonRemovableOrgs);
    setNonRemovableOrgNames(nonRemovableOrgNames);
    setOrgsWithAdminRole(orgsWithAdminRole);
  };

  const getRolesWithContextName = (roles) => {
    const rolesList = roles && roles.map(roleObj => {
      const contextName = roleObj.get('contextName');
      const roleName = roleObj.get('roleName');
      let role = roleName;
      if (contextName) {
        role = `${roleName}(${contextName})`;
      }
      return role;
    });
    return rolesList;
  };

  const onSelectOrganization = (record, selectedRows) => {
    !nonRemovableOrgs.includes(record.get('id')) && setSelected(selectedRows);
  };

  const getTitle = (rolesList) => {
    if (rolesList.contains('Owner')) {
      return 'The user is an owner of this organization';
    } else if (rolesList.contains('Sole Admin')) {
      return 'The user is the only admin in this organization';
    } else if (rolesList.contains('Admin')) {
      return 'User is an admin';
    }
  };

  const renderOrg = (org) => {
    const rolesList = getRolesWithContextName(org.get('roles'));
    const orgIdsWithInfoMessage = nonRemovableOrgs.concat(orgsWithAdminRole);
    return (
      <div className="remove-user-modal__displayfile">
        {org.get('name')}
        {orgIdsWithInfoMessage.includes(org.get('id')) && (
          <div>
            <Tooltip
              placement="right"
              title={getTitle(rolesList)}
              highlight={(rolesList.contains('Owner') || rolesList.contains('Sole Admin')) ? 'danger' : undefined}
            >
              <Icon className={(rolesList.contains('Owner') || rolesList.contains('Sole Admin')) ? 'remove-user-modal' : 'remove-user-modal__icon'} icon="fal fa-info-circle" color={(rolesList.contains('Owner') || rolesList.contains('Sole Admin')) ? 'danger' : undefined} />
            </Tooltip>
          </div>
        )}
      </div>
    );
  };

  const renderUserRole = (org) => {
    const roles = org.get('roles');
    const rolesList = getRolesWithContextName(roles);
    return rolesList && rolesList.join(', ');
  };

  return (
    <div className="tx-stack tx-stack--sm">
      {nonRemovableOrgs.length > 0 && (
        <Banner
          bannerType="warning"
          bannerMessage={`You cannot remove this user from "${nonRemovableOrgNames.join(', ')}" as they are the sole admin or owner of this organization. Please add a new admin or transfer the organization's ownership.`}
        />
      )}
      <Profile
        name={props.data.get('name') as string}
        imgSrc={props.data.get('profile_img_url') as string}
        bgHex={ColorUtils.generateBackgroundColor(props.data.get('id'))}
        showPopover={false}
        size="medium"
        type="primary"
        showDetails
      />
      <TextTitle tag="h3" branded={false}>Organization(s)</TextTitle>
      <Table
        data={Immutable.fromJS(orgsWithRoles)}
        loaded={loaded}
        onSelectRow={(record, willBeSelected, selectedRows) => onSelectOrganization(record, selectedRows)}
        selected={selected}
        disableBorder
        emptyMessage="N/A"
        id="user-organizations-table"
      >
        <Column
          renderCellContent={renderOrg}
          header="NAME"
          id="organization-column"
          relativeWidth={1}
        />
        <Column
          renderCellContent={renderUserRole}
          header="ROLE"
          id="role-column"
          relativeWidth={2}
        />
      </Table>
    </div>
  );
}

export default RemoveUserModalContent;
