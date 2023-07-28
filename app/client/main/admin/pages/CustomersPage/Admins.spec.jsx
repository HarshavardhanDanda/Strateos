import React from 'react';
import Immutable from 'immutable';
import { expect } from 'chai';
import { mount, shallow } from 'enzyme';
import SessionStore from 'main/stores/SessionStore';
import KeyRegistry from 'main/util/UserPreferenceUtil/KeyRegistry';
import { List, Button } from '@transcriptic/amino';
import Sinon from 'sinon';

import AdminsView from './Admins';

describe('AdminsList AdminsView', () => {
  let ref;
  const sandbox = Sinon.createSandbox();
  afterEach(() => {
    if (ref) ref.unmount();
    if (sandbox) sandbox.restore();
  });
  it('renders empty', () => {
    const admins = Immutable.List();
    ref = shallow(<AdminsView onClickCreateAdmin={() => {}} />);
    ref.instance().setState({ adminsPerPage: admins });
    const tables = ref.find(List);
    expect(tables.length).to.equal(1);
    expect(tables.first().prop('data').size).to.equal(0);
  });

  it('renders a create button', () => {
    ref = shallow(
      <AdminsView />
    );
    ref.instance().setState({ canCreateAdmins: true });
    const button = ref.find(Button);
    expect(button.children().text()).to.equal('Add Admin');
  });

  it('wont render a create button without permissions', () => {
    ref = shallow(
      <AdminsView />
    );
    ref.instance().setState({ canCreateAdmins: false });
    const button = ref.find(Button);
    expect(button.length).to.equal(0);
  });

  it('renders many admins', () => {
    const admins = Immutable.List([
      { id: '123' },
      { id: '456' },
      { id: '789' }
    ]);
    ref = shallow(
      <AdminsView />
    );
    ref.instance().setState({ adminsPerPage: admins });
    expect(ref.find(List).first().prop('data').size).to.equal(3);
  });

  it('Admin table should have three columns', () => {
    ref = mount(<AdminsView />);
    const table = ref.find(List);
    expect(table.find('.list__topBar--right').render().text()).to.contains('Columns 3');
  });

  it('should have corresponding persistence key info to enable user preference', () => {
    sandbox.stub(SessionStore, 'getUser').returns(Immutable.Map({ id: 'user3202' }));

    ref = mount(<AdminsView />);
    const list = ref.find(List);
    expect(list.props().persistKeyInfo).to.be.deep.equal({
      appName: 'Web',
      orgId: '_',
      userId: 'user3202',
      key: KeyRegistry.ADMIN_CUSTOMERS_ADMIN_USERS_TABLE
    });
  });

  it('when Add Admin button performs an action', () => {
    const spy = sandbox.stub(AdminsView.prototype, 'openCreateAdminModal');
    ref = shallow(
      <AdminsView />
    );
    ref.instance().setState({ canCreateAdmins: true });
    const button = ref.find(Button);
    button.simulate('click');
    expect(spy.calledOnce).to.be.true;
  });
});
