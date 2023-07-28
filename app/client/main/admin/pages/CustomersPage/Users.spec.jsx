import React from 'react';
import { expect } from 'chai';
import { mount } from 'enzyme';
import Immutable from 'immutable';
import sinon from 'sinon';
import SessionStore from 'main/stores/SessionStore';
import KeyRegistry from 'main/util/UserPreferenceUtil/KeyRegistry';
import { List, Button } from '@transcriptic/amino';
import Users from './Users';

describe('Admin Users Table test', () => {

  let userTable;
  let wrapper;
  const sandbox = sinon.createSandbox();
  const props = {
    results: [{
      id: 'u18dcbwhctbnj',
      name: 'test1',
      email: 'test1@transcriptic.com',
      organizations: [{ name: 'Culver Industries' }, { name: 'Transcriptic' }, { name: 'Project-sol' }],
      featureGroups: ['pricing_breakdown', 'can_view_notebooks']
    }, {
      id: 'u18dcbwhctbnk',
      name: 'test2',
      email: 'test2@transcriptic.com',
      organizations: [{ name: 'Cyrus Biotechnology' }],
      featureGroups: ['can_submit_autoprotocol']
    }, {
      id: 'u18dcbwhctbn',
      name: 'test3',
      email: 'test3@transcriptic.com'
    }]
  };

  afterEach(() => {
    wrapper.unmount();
    sandbox.restore();
  });

  it('Users Table should have list component', () => {
    wrapper = mount(<Users />);
    expect(wrapper.find(List).length).to.equal(1);
  });

  it('Users table should have five columns', () => {
    wrapper = mount(<Users />);
    userTable = wrapper.find(List);
    expect(userTable.find('.list__topBar--right').render().text()).to.contains('Columns 5');
  });

  it('should have corresponding persistence key info to enable user preference', () => {
    sandbox.stub(SessionStore, 'getUser').returns(Immutable.Map({ id: 'user3202' }));

    wrapper = mount(<Users />);
    const list = wrapper.find(List);
    expect(list.props().persistKeyInfo).to.be.deep.equal({
      appName: 'Web',
      orgId: '_',
      userId: 'user3202',
      key: KeyRegistry.ADMIN_CUSTOMERS_USERS_TABLE
    });
  });

  it('Users table should render correct data', () => {
    wrapper = mount(<Users {...props} />);
    const data = props.results;
    userTable = wrapper.find(List);
    expect(userTable.prop('data').toJS()).to.have.lengthOf(3, 'data props is correct');
    expect(userTable.find('td').length).to.equal(data.length * 6, 'cell count is correct');

    const firstRowColumns = userTable.find('td').map(column => column.text());
    let cellCount = 0;
    data.forEach(row => {
      expect(firstRowColumns[cellCount + 1]).to.eql(row.name);
      expect(firstRowColumns[cellCount + 2]).to.eql(row.id);
      expect(firstRowColumns[cellCount + 3]).to.eql(row.email);
      expect(firstRowColumns[cellCount + 4])
        .to.eql((row.organizations ? row.organizations.map(org => org.name) : []).join(','));
      expect(firstRowColumns[cellCount + 5]).to.eql((row.featureGroups || []).join(','));
      cellCount += 6;
    });
  });

  it('Users table should get the masquerade action when only one row is selected', () => {
    wrapper = mount(<Users {...props} />);
    userTable = wrapper.find(List);

    // when only one row is selected masquerade action should be active
    expect(userTable.find('Button')).to.have.lengthOf(0);
    userTable.find('input').at(1).simulate('change', { target: { checked: true } });
    userTable = wrapper.find(List);
    expect(userTable.find(Button)).to.have.lengthOf(1);

    // when more than one row is selected masquerade action should not exist
    userTable.find('input').at(2).simulate('change', { target: { checked: true } });
    userTable = wrapper.find(List);
    expect(userTable.find(Button)).to.have.lengthOf(0);
  });
});
