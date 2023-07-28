import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import Immutable from 'immutable';
import sinon from 'sinon';
import { List, Table } from '@transcriptic/amino';
import UserActions from 'main/actions/UserActions';
import SessionStore from 'main/stores/SessionStore';
import KeyRegistry from 'main/util/UserPreferenceUtil/KeyRegistry';
import OrganizationStore from 'main/stores/OrganizationStore';
import FeatureStore from 'main/stores/FeatureStore';
import FeatureConstants from '@strateos/features';
import Users from './Users';
import RemoveUserModal from './RemoveUserModal';

const getUsersComponent = (context = { context: { router: {} } }) => {
  return shallow(<Users />, context);
};

describe('Users Table test', () => {

  let userTable;
  let wrapper;
  const sandbox = sinon.createSandbox();

  const response = {
    data: [{
      id: 'u18dcbwhctbnj',
      attributes: {
        name: 'test1',
        email: 'test1@transcriptic.com',
        org_ids: ['org13'],
        invitation_sent_at: '2017-07-08T10:23:12.648-07:00',
        invitation_accepted_at: '2017-07-08T10:23:12.648-07:00',
        last_sign_in_at: '2017-07-08T10:23:12.648-07:00'
      },
      relationships: {
        organizations: {
          data: [
            {
              type: 'organizations',
              id: 'org13'
            }
          ]
        }
      }
    }],
    meta: {
      record_count: 1
    }
  };

  afterEach(() => {
    wrapper.unmount();
    sandbox.restore();
  });

  beforeEach(() => {
    sandbox.stub(UserActions, 'fetchUsers').returns({
      then: (cb) => {
        cb(response);
        return { fail: () => ({}) };
      }
    });
  });

  it('Users Table should have list component', () => {
    wrapper = getUsersComponent();
    expect(wrapper.find(List).length).to.equal(1);
  });

  it('Users table should have seven columns', () => {
    wrapper = getUsersComponent();
    userTable = wrapper.find(List).dive();
    expect(userTable.find('.list__topBar--right').render().text()).to.contains('Columns 7');
  });

  it('should allow toggling of columns', () => {
    wrapper = getUsersComponent().setState({
      visibleColumns: ['name', 'ID', 'email', 'organizations'],
      hasLoaded: false
    });
    const list = wrapper.find('List').dive();
    let tableColumns = list.find('Table').find('Column');
    expect(tableColumns.length).to.equal(4);

    wrapper.setState({
      visibleColumns: ['name', 'ID', 'email', 'organizations', 'invitation sent at']
    });
    const updatedList = wrapper.find('List').dive();
    tableColumns = updatedList.find('Table').find('Column');
    expect(tableColumns.length).to.equal(5);

    const columnSelectionButton = updatedList.find('.fas').first();
    columnSelectionButton.simulate('click');
    const columnFilter = updatedList.find({ isMultiSelect: true }).dive().find({ groupName: 'column_filter' });
    const optionsList = columnFilter.dive().find('CheckboxGroup').dive().find('Checkbox');

    expect(optionsList.at(0).dive().find('input[type="checkbox"]').props().checked).to.be.true;
    expect(optionsList.at(1).dive().find('input[type="checkbox"]').props().checked).to.be.true;
    expect(optionsList.at(2).dive().find('input[type="checkbox"]').props().checked).to.be.true;
    expect(optionsList.at(3).dive().find('input[type="checkbox"]').props().checked).to.be.true;
    expect(optionsList.at(4).dive().find('input[type="checkbox"]').props().checked).to.be.true;
    expect(optionsList.at(5).dive().find('input[type="checkbox"]').props().checked).to.be.false;
    expect(optionsList.at(6).dive().find('input[type="checkbox"]').props().checked).to.be.false;
  });

  it('should have corresponding persistence key info to enable user preference', () => {
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.Map({ id: 'org13' }));
    sandbox.stub(SessionStore, 'getUser').returns(Immutable.Map({ id: 'user3202' }));

    wrapper = getUsersComponent();
    const list = wrapper.find(List);
    expect(list.props().persistKeyInfo).to.be.deep.equal({
      appName: 'Web',
      orgId: 'org13',
      userId: 'user3202',
      key: KeyRegistry.CUSTOMERS_USERS_TABLE
    });
  });

  it('Users table should render correct data', () => {
    const org = Immutable.Map({
      id: 'org13',
      name: 'test_name',
      subdomain: 'test_subdomain'
    });
    sandbox.stub(OrganizationStore, 'getById').returns(org);
    wrapper = getUsersComponent();
    userTable = wrapper.find(List).dive().find(Table).dive();
    const bodyCell1 = userTable.find('BodyCell').at(0);
    expect(bodyCell1.dive().find('td').text()).to.equal('test1');
    const bodyCell2 = userTable.find('BodyCell').at(1);
    expect(bodyCell2.dive().find('td').text()).to.equal('u18dcbwhctbnj');
    const bodyCell3 = userTable.find('BodyCell').at(2);
    expect(bodyCell3.dive().find('td').text()).to.equal('test1@transcriptic.com');
    const bodyCell4 = userTable.find('BodyCell').at(3);
    expect(bodyCell4.dive().find('td').text()).to.equal('test_name');
    const bodyCell5 = userTable.find('BodyCell').at(4);
    expect(bodyCell5.dive().find('Time').props().data).to.equal('2017-07-08T10:23:12.648-07:00');
    const bodyCell6 = userTable.find('BodyCell').at(5);
    expect(bodyCell6.dive().find('Time').props().data).to.equal('2017-07-08T10:23:12.648-07:00');
    const bodyCell7 = userTable.find('BodyCell').at(6);
    expect(bodyCell7.dive().find('Time').props().data).to.equal('2017-07-08T10:23:12.648-07:00');
  });

  it('should show delete icons column if user has can remove users from platform permission', () => {
    sandbox.stub(FeatureStore, 'hasPlatformFeature').withArgs(FeatureConstants.CAN_REMOVE_USERS_FROM_PLATFORM).returns(true);

    wrapper = getUsersComponent();
    userTable = wrapper.find(List).dive();
    expect(userTable.find('.list__topBar--right').render().text()).to.contains('Columns 8');
    const bodyCell8 = wrapper.find(List).dive().find(Table).dive()
      .find('BodyCell')
      .at(7);
    expect(bodyCell8.dive().find('Button').props().icon).to.equal('fa-light fa-trash');
    expect(bodyCell8.dive().find('Button').props().size).to.equal('small');
  });

  it("should not show delete icons column if user don't have remove users from platform permission", () => {
    wrapper = getUsersComponent();
    userTable = wrapper.find(List).dive();
    expect(userTable.find('.list__topBar--right').render().text()).to.contains('Columns 7');
  });

  it('should open remove user modal when clicked on delete icon if permissions met', () => {
    sandbox.stub(FeatureStore, 'hasPlatformFeature').withArgs(FeatureConstants.CAN_REMOVE_USERS_FROM_PLATFORM).returns(true);

    wrapper = getUsersComponent();
    userTable = wrapper.find(List).dive().find(Table).dive();
    const bodyCell8 = userTable.find('BodyCell').at(7);
    const deleteButton = bodyCell8.dive().find('Button');
    deleteButton.simulate('click');
    const modal = wrapper.find(RemoveUserModal);
    expect(modal.length).to.equal(1);
  });

  it('should check remove user modal props exist or not', () => {
    wrapper = getUsersComponent();
    const modal = wrapper.find(RemoveUserModal);
    expect(modal.length).to.equal(1);
    expect(modal.props().modalId).to.exist;
    expect(modal.props().fetchUserList).to.exist;
  });
});
