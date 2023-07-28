import Immutable from 'immutable';
import _         from 'lodash';
import PropTypes from 'prop-types';
import React     from 'react';

import { Spinner, Table, Column, Tooltip } from '@transcriptic/amino';
import CollaboratorActions from 'main/actions/CollaboratorActions';
import ModalActions        from 'main/actions/ModalActions';
import OrganizationActions from 'main/actions/OrganizationActions';
import UserActions         from 'main/actions/UserActions';
import { SinglePaneModal } from 'main/components/Modal';
import UserProfile         from 'main/components/UserProfile';
import ConnectToStoresHOC  from 'main/containers/ConnectToStoresHOC';
import SessionStore        from 'main/stores/SessionStore';
import UserStore           from 'main/stores/UserStore';
import AccessControlActions from 'main/actions/AccessControlActions';
import LabAPI         from 'main/api/LabAPI';
import FeatureStore         from 'main/stores/FeatureStore';
import LabStore             from 'main/stores/LabStore';
import FeatureConstants from '@strateos/features';
import AddCollaboratorDropDown  from './AddCollaboratorDropDown';
import './OrgMembersTable.scss';

function CollaboratorActionsModal(props) {

  const removeCollaborator = () => {
    const org = props.customerOrganization ? props.customerOrganization : props.org;
    const subdomain = props.customerOrganization ? org.get('subdomain') : undefined;
    const customerOrgId = props.customerOrganization ? org.get('id') : undefined;
    const permission_id = props.permission_id;
    const existingPermissions = FeatureStore.getUserPermission(props.user.get('id'));

    return CollaboratorActions.destroy(props.user.get('id'), permission_id, existingPermissions.size === 1, subdomain, customerOrgId)
      .done(props.reloadTable);
  };

  const transferOwnership = () => {
    const { org, customerOrganization } = props;
    if (customerOrganization) {
      return OrganizationActions.update(customerOrganization.get('id'), { owner_id: props.user.get('id') }, customerOrganization.get('subdomain')).done(props.reloadTable);
    } else {
      return OrganizationActions.update(org.get('id'), { owner_id: props.user.get('id') }).done(props.reloadTable);
    }
  };

  const triggerAction = () => {
    props.actionType === 'remove' ? removeCollaborator() : transferOwnership();
  };

  const featureGroupName = () => {
    const permission = props.userPermissions.filter((p) => {
      return p.get('id') === props.permission_id;
    }).toJS();
    return permission[0] ? permission[0].featureGroup.label : undefined;
  };

  const labName = () => {
    const permission = props.userPermissions.filter((p) => {
      return p.get('id') === props.permission_id;
    }).toJS();
    const contextId = permission[0] ? permission[0].contextId : undefined;
    return _.startsWith(contextId, 'lb') ? ' of ' + LabStore.getById(contextId, Immutable.fromJS({})).get('name') : undefined;
  };

  return (
    <SinglePaneModal
      title="Are You Sure?"
      onAccept={triggerAction}
      acceptText={props.actionType === 'remove' ? 'Remove' : 'Transfer'}
      modalId={props.modalId}
    >
      <Choose>
        <When condition={props.user}>
          <Choose>
            <When condition={props.actionType === 'remove'}>
              <span>
                <span>Are you sure you want to remove </span>
                <strong>
                  {props.user.get('name')} &lt;{props.user.get('email')}&gt;
                </strong>
                <span> as a </span>
                <strong>
                  {featureGroupName()}
                </strong>
                <strong>
                  {labName()}
                </strong>
                <span> from the organization?</span>
              </span>
            </When>
            <Otherwise>
              <span>
                <span>Are you sure you want to transfer ownership to </span>
                <strong>
                  {props.user.get('name')} &lt;{props.user.get('email')}&gt;
                </strong>
              </span>
            </Otherwise>
          </Choose>
        </When>
        <Otherwise>
          <Spinner />
        </Otherwise>
      </Choose>
    </SinglePaneModal>
  );
}

CollaboratorActionsModal.propTypes = {
  collaborator: PropTypes.instanceOf(Immutable.Map),
  user:         PropTypes.instanceOf(Immutable.Map),
  org:          PropTypes.instanceOf(Immutable.Map),
  actionType:   PropTypes.string,
  modalId:      PropTypes.string.isRequired,
  reloadTable:   PropTypes.func.isRequired
};

class OrgMembersTable extends React.Component {

  static get propTypes() {
    return {
      subdomain:          PropTypes.string.isRequired,
      canAdminCurrentOrg: PropTypes.bool,
      currentUser:        PropTypes.instanceOf(Immutable.Map),
      org:                PropTypes.instanceOf(Immutable.Map)
    };
  }

  constructor(props) {
    super(props);
    this.state = {
      user: undefined,
      collaborator: undefined,
      permission_id: undefined,
      isCloudLab: false,
      isLoaded: true,
      data: Immutable.Map(),
      userIds: []
    };
    this.onCreateCollaborator = this.onCreateCollaborator.bind(this);
    this.loadOrganizationCollaboratorsAndUsers = this.loadOrganizationCollaboratorsAndUsers.bind(this);
    this.renderActions = this.renderActions.bind(this);
    this.userRecords = this.userRecords.bind(this);
    this.renderTableRecord = this.renderTableRecord.bind(this);
    this.renderActionRecord = this.renderActionRecord.bind(this);
    this.renderTable = this.renderTable.bind(this);
  }

  componentWillMount() {
    this.loadLabs();
    this.loadOrganizationCollaboratorsAndUsers();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.subdomain !== this.props.subdomain) {
      this.loadLabs();
      this.loadOrganizationCollaboratorsAndUsers();
    }
  }

  onCreateCollaborator(name, email, featureGroupId, labId) {
    const { customerOrganization } = this.props;
    const subdomain = customerOrganization && customerOrganization.get('subdomain');
    const customerOrgId = customerOrganization && customerOrganization.get('id');
    return CollaboratorActions.create(name, email, featureGroupId, labId, subdomain, customerOrgId)
      .done(() => this.loadOrganizationCollaboratorsAndUsers());
  }

  loadOrganizationCollaboratorsAndUsers() {
    const { customerOrganization } = this.props;
    this.setState({ isLoaded: false });
    const loadPermissions = customerOrganization ?
      AccessControlActions.loadPermissionsByOrg({ organizationId: customerOrganization.get('id') }) :
      AccessControlActions.loadPermissions({});
    loadPermissions
      .done((res) => {
        const userIds = _.uniq(_.map(res, 'userId'));
        UserActions.loadUsers(userIds).done(() => {
          if (customerOrganization) {
            const userPermissions =  FeatureStore.getUserPermissionByIds(userIds);
            this.setState({
              data: this.userRecords(userPermissions),
              userIds: userIds,
              isLoaded: true });
          } else {
            const userPermissions = this.props.userPermissions;
            this.setState({ data: this.userRecords(userPermissions), isLoaded: true });
          }
        });
      });
  }

  loadLabs() {
    const operatedById = this.props.customerOrganization ? this.props.customerOrganization.get('id') :
      SessionStore.getOrg().get('id');
    LabAPI.index({
      filters: {
        operated_by_id: operatedById
      }
    }).done(
      res => {
        this.setState({ isCloudLab: res.data.length === 0 });
      });
  }

  userRecords(userPermissions) {
    const arr = [];
    const { org, customerOrganization, canAdminCurrentOrg } = this.props;
    let orgOwner;
    if (customerOrganization) {
      orgOwner = UserStore.getById(customerOrganization.get('owner_id'));
    } else {
      orgOwner = UserStore.getById(org.get('owner_id'));
    }
    userPermissions.forEach((u) => {
      const user = UserStore.getById(u.get('userId'));
      if (user) {
        const element = {};
        element.id = u.get('id');
        element.user = user;
        element[2] = user.get('email');
        element[3] = u.get('featureGroup') && u.get('featureGroup').get('label');
        element[4] = _.startsWith(u.get('contextId'), 'lb') ? LabStore.getById(u.get('contextId'), Immutable.fromJS({})).get('name') : undefined;
        canAdminCurrentOrg && (element.actions = () => this.renderActions(user, u.get('id'), orgOwner));
        arr.push(element);
      }
    });
    if (orgOwner) {
      const owner = {};
      owner.id = orgOwner.get('id');
      owner.user = orgOwner;
      owner[2] = orgOwner.get('email');
      owner[3] = 'Owner';
      owner[4] = undefined;
      owner.actions = () => {};
      arr.push(owner);
    }
    const sortedArray = _.sortBy(arr, (element) => element.user.get('name'));
    return Immutable.fromJS(sortedArray);
  }

  renderUserRecord(record) {
    return <UserProfile user={record.get('user')} showDetails />;
  }

  renderTableRecord(record, rowIndex, colIndex) {
    return <p>{record.get((colIndex + 1).toString())}</p>;
  }

  renderActionRecord(record) {
    return record.get('actions')();
  }

  renderThisColumn(column) {
    const canAdminCurrentOrg = this.props.canAdminCurrentOrg;
    switch (column.props.header) {
      case 'Lab': return !this.state.isCloudLab;
      case 'Actions': return canAdminCurrentOrg;
      default: return true;
    }
  }

  renderTable()  {

    const columns = [
      <Column renderCellContent={this.renderUserRecord} header="Name" id="name-column" key="name-column" />,
      <Column renderCellContent={this.renderTableRecord} header="Email" id="email-column" key="email-column" />,
      <Column renderCellContent={this.renderTableRecord} header="Role" id="role-column" key="role-column" />,
      <Column renderCellContent={this.renderTableRecord} header="Lab" id="lab-column" key="lab-column" />,
      <Column renderCellContent={this.renderActionRecord} header="Actions" id="actions-column" key="actions-column" />
    ];

    return (
      <Table
        data={this.state.data}
        loaded={this.state.isLoaded}
        disabledSelection
        id="organization-members"
      >
        { columns.filter((column) => (this.renderThisColumn(column))) }
      </Table>
    );
  }

  renderActions(user, permission_id, orgOwner) {
    const { customerOrganization } = this.props;
    let isCurrUserOwner;
    if (!customerOrganization) {
      isCurrUserOwner = SessionStore.isOrgOwner();
    } else {
      isCurrUserOwner = SessionStore.getUser().get('id') == customerOrganization.get('owner_id');
    }
    const isRowOfOwner = orgOwner && user.get('id') == orgOwner.get('id');
    const isCurrentUser = user.get('id') === this.props.currentUser.get('id');

    if (!isRowOfOwner) {
      return (
        <div>
          <a
            className="org-members-table__admin-action"
            onClick={() => {
              this.setState({ user: user, actionType: 'remove', permission_id: permission_id });
              ModalActions.open('CollaboratorActionsModal');
            }}
          >
            { !isCurrentUser && (
            <Tooltip
              placement="bottom"
              title="Remove"
            >
              <i className="fas fa-trash" />
            </Tooltip>
            )
            }
          </a>
          {
            ((isCurrUserOwner || FeatureStore.hasPlatformFeature(FeatureConstants.TRANSFER_OWNERSHIP_GLOBAL)) && !isRowOfOwner) && (
            <a
              className="org-members-table__admin-action"
              onClick={() => {
                this.setState({ user: user, actionType: 'transfer' });
                ModalActions.open('CollaboratorActionsModal');
              }}
            >
              <Tooltip
                placement="bottom"
                title="Transfer Ownership"
              >
                <i className="fas fa-exchange" />
              </Tooltip>
            </a>
            )}
        </div>
      );
    }
    return undefined;
  }

  render() {
    const { data, userIds } = this.state;
    const { customerOrganization, canAdminCurrentOrg } = this.props;
    const userPermissions = userIds ? FeatureStore.getUserPermissionByIds(userIds) : this.props.userPermissions;
    const existingCollaborators  = data.map(u =>  `${u.get('2')}_${u.get('3')}_${u.get('4')}`);

    return (
      <div className="tx-stack tx-stack--sm">
        {
          <CollaboratorActionsModal
            modalId="CollaboratorActionsModal"
            user={this.state.user}
            org={this.props.org}
            customerOrganization={customerOrganization}
            actionType={this.state.actionType}
            permission_id={this.state.permission_id}
            userPermissions={userPermissions}
            reloadTable={this.loadOrganizationCollaboratorsAndUsers}
          />
        }
        <p className="tx-type--secondary tx-type--default">
          Organization members are collaborators that have permission to log in and use this Strateos
          account. New members will receive an email prompting them to create a password and log in when
          you add them here.
        </p>

        {
          canAdminCurrentOrg && (
            <AddCollaboratorDropDown
              onCreate={this.onCreateCollaborator}
              existingCollaborators={existingCollaborators}
              customerOrganizationId={customerOrganization && customerOrganization.get('id')}
            />
          )
        }
        {
          (!userPermissions || !existingCollaborators) ?
            <Spinner />
            :
            this.renderTable()
        }
      </div>
    );
  }
}

const getStateFromStores = ({ customerOrganization }) => {
  const org           = SessionStore.getOrg();
  const userPermissions = FeatureStore.getUserPermissions();

  return {
    canAdminCurrentOrg: customerOrganization ? SessionStore.canAdminCustomerOrg() : SessionStore.canAdminCurrentOrg(),
    currentUser:        SessionStore.getUser(),
    org:                org,
    userPermissions:    userPermissions
  };
};

export default ConnectToStoresHOC(OrgMembersTable, getStateFromStores);
export { OrgMembersTable };
