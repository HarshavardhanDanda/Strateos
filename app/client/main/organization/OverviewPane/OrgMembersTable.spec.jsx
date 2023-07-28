import React            from 'react';
import Immutable        from 'immutable';
import { Card, Table }  from '@transcriptic/amino';
import UserStore        from 'main/stores/UserStore';
import LabStore         from 'main/stores/LabStore';
import SessionStore     from 'main/stores/SessionStore';
import { expect }       from 'chai';
import { shallow, mount }  from 'enzyme';
import sinon               from 'sinon';
import AccessControlActions from 'main/actions/AccessControlActions';
import UserActions  from 'main/actions/UserActions';
import FeatureStore from 'main/stores/FeatureStore';
import LabAPI         from 'main/api/LabAPI';
import Dispatcher from 'main/dispatcher';
import FeatureConstants from '@strateos/features';
import { OrgMembersTable } from './OrgMembersTable';
import { OverviewPane }    from './index';

describe('OrganizationTable', () => {
  let ref;
  const sandbox = sinon.createSandbox();
  const org = Immutable.Map({ id: 'org12254323', owner_id: 'id1', 'validated?': true });
  beforeEach(() => {
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.fromJS({ id: 'org13' }));
  });

  afterEach(() => {
    if (ref) ref.unmount();
    if (sandbox) sandbox.restore();
  });

  const userPermissions = Immutable.fromJS([
    { id: '2f326f14-1280-4d2b-a9f4-beba22adc36b',
      userId: 'id1',
      contextId: 'org13',
      featureGroup: {
        id: '62c18588-d5ad-423c-9362-adc1af4184c1',
        label: 'Admin',
        description: 'Features applicable to users who',
        context: 'ORGANIZATION'
      }
    },
    { id: '2f326f14-1280-4d2b-a9f4-beba22adc36b',
      userId: 'id2',
      contextId: 'org13',
      featureGroup: {
        id: '62c18588-d5ad-423c-9362-adc1af4184c1',
        label: 'User',
        description: 'Features applicable to users who',
        context: 'ORGANIZATION'
      }
    },
    { id: '2f326f14-1280-4d2b-a9f4-beba22adc36b',
      userId: 'id3',
      contextId: 'lb1fczg23pe6jze',
      featureGroup: {
        id: '62c18588-d5ad-423c-9362-adc1af4184c1',
        label: 'Lab Manager',
        description: 'Features applicable to users who',
        context: 'LAB'
      }
    }
  ]);

  const data = Immutable.fromJS([
    {
      2: 'email1@transcriptic.com',
      3: 'Owner',
      4: undefined,
      id: '24261daf-8f34-4f49-8221-914c7287b48b',
      user: {
        id: 'id1',
        email: 'email1@transcriptic.com',
        created_at: '2019-03-12T12:51:04.167-07:00',
        name: 'User 1'
      }
    },
    {
      2: 'email2@transcriptic.com',
      3: 'User',
      4: undefined,
      id: '24261daf-8f34-4f49-8221-914c7287b48c',
      user: {
        id: 'id2',
        email: 'email2@transcriptic.com',
        created_at: '2019-03-13T12:51:04.167-07:00',
        name: 'User 2'
      }
    },
    {
      2: 'email3@transcriptic.com',
      3: 'Lab Manager',
      4: 'San Diego',
      id: '24261daf-8f34-4f49-8221-914c7287b48d',
      user: {
        id: 'id3',
        email: 'email3@transcriptic.com',
        created_at: '2019-03-14T12:51:04.167-07:00',
        name: 'User 3'
      }
    },
    {
      2: 'email4@transcriptic.com',
      3: 'Admin',
      4: undefined,
      id: '24261daf-8f34-4f49-8221-914c7287b48d',
      user: {
        id: 'id4',
        email: 'email4@transcriptic.com',
        created_at: '2019-03-14T12:51:04.167-07:00',
        name: 'User 4'
      }
    }
  ]);
  const customerUserPermissions = Immutable.fromJS([
    {
      id: 'fdd6d2d2-1933-4b9-a290-a2604af',
      userId: 'u18wtwypufnub',
      featureGroup: {
        id: 'b615fd99-f263-4f18-1e37-0e4a40ff141e',
        label: 'Admin',
        description: 'Features applicable to users who manages organizations administrative tasks like adding their own users, granting permissions',
        context: 'ORGANIZATION'
      },
      contextId: 'org18wtwz789czp'
    },
    {
      id: '894a04a5-c7e9-431e-8e6e-9735f9db5cf7',
      userId: 'u18wtwypufnub',
      featureGroup: {
        id: '0085f-eddd-f744-ab91-ea84b9e39bcd',
        label: 'User',
        description: 'Features applicable to scientist',
        context: 'ORGANIZATION'
      },
      contextId: 'org18wtwz789czp'
    },
    {
      id: '023-fe7b-4671-82d4-3e344539',
      userId: 'u18wtwypufnub',
      featureGroup: {
        id: 'b879e0b9-cd30-416c-af6c-6d24d74fdaed',
        label: 'Manage Packages',
        description: 'Manage Packages',
        context: 'ORGANIZATION'
      },
      contextId: 'org18wtwz789czp'
    },
    {
      id: '034abf23-fe7b-4671-82d4-3eb4aa344539',
      userId: 'u18wtwypacyl',
      featureGroup: {
        id: 'd30-416c-af6c-6d24d74fdaed',
        label: 'Manage Packages',
        description: 'Manage Packages',
        context: 'ORGANIZATION'
      },
      contextId: 'org18wtwz789czp'
    }
  ]);
  const userData = Immutable.fromJS([
    { id: 'u18wtwypufnub', name: 'User name', email: 'user1@gmail.com' },
    { id: 'u18wtwypacyl', name: 'Other name', email: 'user2@gmail.com' }
  ]);
  it('Card is present', () => {
    ref = shallow(<OverviewPane subdomain="" org={org} isOrgAdmin />);
    const result = ref.find(Card);
    expect(result.length).to.be.eql(2);
  });
  it('Organization Card main text is present', () => {
    ref = shallow(<OrgMembersTable org={org} subdomain="" userPermissions={userPermissions} />);
    const orgtext = ref.find('.tx-type--secondary');
    expect(orgtext.text()).to.be.eql('Organization members are collaborators that have permission'
                                    + ' to log in and use this Strateos account.'
                                    + ' New members will receive an email prompting them to'
                                    + ' create a password and log in when you add them here.');
  });
  it('Organization users table is present', () => {
    ref = shallow(<OrgMembersTable org={org} subdomain="" userPermissions={userPermissions} />);
    const result = ref.find(Table);
    expect(result.length).to.be.eql(1);
  });
  it('owner role should be displayed in the organization members table', () => {
    sandbox.stub(UserStore, 'getById').withArgs('id1').returns(Immutable.fromJS({ id: 'id1', name: 'Users Name' }));
    ref = mount(<OrgMembersTable org={org} subdomain="transciptic" userPermissions={userPermissions} />)
      .setState({ data: data, isLoaded: true });
    const rowData = ref.find('Table').find('tbody').find('Row');
    expect(rowData.length).to.be.equal(4);
    expect(rowData.at(0).text()).to.include('Owner');
  });
  it('user role should be displayed in the organization members table', () => {
    sandbox.stub(UserStore, 'getById').withArgs('id2').returns(Immutable.fromJS({ id: 'id2', name: 'Users Name' }));
    ref = mount(<OrgMembersTable org={org} subdomain="transciptic" userPermissions={userPermissions} />)
      .setState({ data: data, isLoaded: true });
    const rowData = ref.find('Table').find('tbody').find('Row');
    expect(rowData.at(1).text()).to.include('User');
  });
  it('admin role should be displayed in the organization members table', () => {
    sandbox.stub(UserStore, 'getById').withArgs('id1').returns(Immutable.fromJS({ id: 'id1', name: 'Users Name' }));
    ref = mount(<OrgMembersTable org={Immutable.Map({ owner_id: 'id4', 'validated?': true })} subdomain="transciptic" userPermissions={userPermissions} />)
      .setState({ data: data, isLoaded: true });
    const rowData = ref.find('Table').find('tbody').find('Row');
    expect(rowData.at(3).text()).to.include('Admin');
  });
  it('Right lab associated with role should be displayed', () => {
    sandbox.stub(UserStore, 'getById').withArgs('id3').returns(Immutable.fromJS({ id: 'id3', name: 'Users Name' }));
    sandbox.stub(LabStore, 'getById').returns(Immutable.fromJS({ name: 'Menlo Park' }));
    ref = mount(<OrgMembersTable org={org} subdomain="" userPermissions={userPermissions} />).setState({ data: data, isLoaded: true });
    const rowData = ref.find('Table').find('tbody').find('Row');
    expect(rowData.at(2).text()).to.include('Lab Manager');
    expect(rowData.at(2).text()).to.include('San Diego');
  });
  it('should not show lab column for cloud lab org', () => {
    sandbox.stub(UserStore, 'getById').withArgs('id2').returns(Immutable.fromJS({ id: 'id2', name: 'Users Name' }));
    ref = mount(<OrgMembersTable org={org} subdomain="" userPermissions={userPermissions} />).setState({ data: data, isCloudLab: true, isLoaded: true });
    const headerCells = ref.find('Table').find('HeaderCell');
    expect(headerCells.length).to.be.equal(3);
    expect(headerCells.toString()).to.not.include('Lab');
  });

  it('component should mount without throwing errors', () => {
    ref = mount(<OrgMembersTable  subdomain="subdomain" customerOrganization={org} />);
  });

  it('should display correct data for customerOrganization', () => {
    const userPerms = Immutable.fromJS([
      {
        id: '2f326f14-1280-4d2b-a9f4-beba22adc36b',
        userId: 'id1',
        contextId: 'org13',
        featureGroup: {
          id: '62c18588-d5ad-423c-9362-adc1af4184c1',
          label: 'Admin',
          description: 'Features',
          context: 'ORGANIZATION'
        }
      }
    ]);
    sandbox.stub(AccessControlActions, 'loadPermissionsByOrg')
      .returns({ done: (cb) => cb(userPerms.toJS()) });
    sandbox.stub(UserActions, 'loadUsers')
      .returns({ done: (cb) => cb() });
    sandbox.stub(FeatureStore, 'getUserPermissionByIds')
      .returns(userPerms);
    sandbox.stub(UserStore, 'getById').withArgs('id1')
      .returns(Immutable.fromJS({ id: 'id1', name: 'User name' }));
    sandbox.stub(LabAPI, 'index')
      .returns({ done: (cb) => cb({ data: [{ id: 'id1' }] }) });

    ref = mount(<OrgMembersTable  subdomain="subdomain" customerOrganization={org} />);
    const rowData = ref.find('Table').find('tbody').find('Row');
    expect(rowData.length).to.be.equal(2);
  });

  it('should display transfer ownership icon if logged in user has TRANSFER_OWNERSHIP_GLOBAL permission', () => {
    const customerOrg = Immutable.fromJS({ id: 'org18wtwz789czp', owner_id: 'u18wtwypufnub', 'validated?': true });

    Dispatcher.dispatch({ type: 'USER_SEARCH_RESULTS', results: userData.toJS() });
    sandbox.stub(FeatureStore, 'hasPlatformFeature')
      .withArgs(FeatureConstants.TRANSFER_OWNERSHIP_GLOBAL).returns(true);
    sandbox.stub(AccessControlActions, 'loadPermissionsByOrg')
      .returns({ done: (cb) => cb(customerUserPermissions.toJS()) });
    sandbox.stub(UserActions, 'loadUsers')
      .returns({ done: (cb) => cb() });
    sandbox.stub(FeatureStore, 'getUserPermissionByIds')
      .returns(customerUserPermissions);
    sandbox.stub(LabAPI, 'index')
      .returns({ done: (cb) => cb({ data: [{ id: 'u18wtwypacyl' }] }) });
    sandbox.stub(SessionStore, 'getUser')
      .returns(Immutable.fromJS({ id: 'abc123' }));

    ref = shallow(<OrgMembersTable
      subdomain=""
      customerOrganization={customerOrg}
      userPermissions={customerUserPermissions}
      canAdminCurrentOrg
      currentUser={Immutable.fromJS({ id: 'u123' })}
    />);
    const toolTips = ref.find('Table').dive().find('Body').find('Row')
      .at('0')
      .find('BodyCell')
      .at('4')
      .find('Tooltip');
    expect(toolTips.length).to.be.equal(2);

    const toolTip = ref.find('Table').dive().find('Body').find('Row')
      .at('0')
      .find('BodyCell')
      .at('4')
      .find('Tooltip')
      .at('1');
    expect(toolTip.props().title).to.equal('Transfer Ownership');
  });

  it('should not display transfer ownership icon if logged in user does not have TRANSFER_OWNERSHIP_GLOBAL permission', () => {
    const customerOrg = Immutable.fromJS({ id: 'org18wtwz789czp', owner_id: 'u18wtwypufnub', 'validated?': true });

    Dispatcher.dispatch({ type: 'USER_SEARCH_RESULTS', results: userData.toJS() });
    sandbox.stub(FeatureStore, 'hasPlatformFeature')
      .withArgs(FeatureConstants.TRANSFER_OWNERSHIP_GLOBAL).returns(false);
    sandbox.stub(AccessControlActions, 'loadPermissionsByOrg')
      .returns({ done: (cb) => cb(customerUserPermissions.toJS()) });
    sandbox.stub(UserActions, 'loadUsers')
      .returns({ done: (cb) => cb() });
    sandbox.stub(FeatureStore, 'getUserPermissionByIds')
      .returns(customerUserPermissions);
    sandbox.stub(LabAPI, 'index')
      .returns({ done: (cb) => cb({ data: [{ id: 'u18wtwypacyl' }] }) });
    sandbox.stub(SessionStore, 'getUser')
      .returns(Immutable.fromJS({ id: 'abc123' }));

    ref = shallow(<OrgMembersTable
      subdomain=""
      customerOrganization={customerOrg}
      userPermissions={customerUserPermissions}
      canAdminCurrentOrg
      currentUser={Immutable.fromJS({ id: 'u123' })}
    />);
    const toolTips = ref.find('Table').dive().find('Body').find('Row')
      .at('0')
      .find('BodyCell')
      .at('4')
      .find('Tooltip');
    expect(toolTips.length).to.be.equal(1);
    const toolTip = ref.find('Table').dive().find('Body').find('Row')
      .at('0')
      .find('BodyCell')
      .at('4')
      .find('Tooltip')
      .at('0');
    expect(toolTip.props().title).to.equal('Remove');
  });

  it('should render without any errors if user permission featureGroup is undefined', () => {
    const badUserPermissions = Immutable.fromJS([
      {
        id: '2f326f14-1280-4d2b-a9f4-beba22adc36b',
        userId: 'id1',
        contextId: 'org13',
        featureGroup: undefined
      }
    ]);
    sandbox.stub(AccessControlActions, 'loadPermissionsByOrg')
      .returns({ done: (cb) => cb(badUserPermissions.toJS()) });
    sandbox.stub(UserActions, 'loadUsers')
      .returns({ done: (cb) => cb() });
    sandbox.stub(FeatureStore, 'getUserPermissionByIds')
      .returns(badUserPermissions);
    sandbox.stub(UserStore, 'getById').withArgs('id1')
      .returns(Immutable.fromJS({ id: 'id1', name: 'User name' }));

    ref = mount(<OrgMembersTable  subdomain="subdomain" customerOrganization={org} />);
    const data = ref.state().data.toJS();
    expect(data[0]['3']).to.be.undefined;
    const rowData = ref.find('Table').find('tbody').find('Row');
    const roleColumn = rowData.at(0).find('BodyCell').at(2);
    expect(roleColumn.find('p').text()).to.be.empty;
  });
});
