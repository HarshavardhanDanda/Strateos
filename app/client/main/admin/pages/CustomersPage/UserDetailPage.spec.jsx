import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import Immutable from 'immutable';
import sinon from 'sinon';
import SessionStore from 'main/stores/SessionStore';
import UserDetailPage from './UserDetailPage';

describe('Admin Users Detail Page test', () => {

  let wrapper, getUser;
  const sandbox = sinon.createSandbox();

  const user = {
    id: 'u18dcbwhctbnj',
    name: 'test1',
    email: 'test1@transcriptic.com',
    organizations: [{ name: 'Culver Industries' }, { name: 'Transcriptic' }, { name: 'Project-sol' }],
    featureGroups: ['pricing_breakdown', 'can_view_notebooks'],
    'lockedOut?': true
  };

  function getTestComponent(u) {
    return shallow(
      <UserDetailPage
        user={Immutable.fromJS(u)}
        match={{ params: { userId: 'u18dcbwhctbnj' } }}
      />
    );
  }

  beforeEach(() => {
    getUser = sandbox.stub(SessionStore, 'getUser')
      .returns(Immutable.fromJS({ permissions: ['can_manage_users'] }));
  });

  afterEach(() => {
    wrapper.unmount();
    sandbox.restore();
  });

  it('Users Detail should have Profile View when user prop is passed', () => {
    wrapper = getTestComponent(user);
    expect(wrapper.dive().find('ProfileView').length).to.equal(1);
  });

  it('Users Detail should have spinner when no user is passed', () => {
    wrapper = getTestComponent(undefined);
    expect(wrapper.dive().find('Spinner').length).to.equal(1);
  });

  it('Users Details Title should have correct links', () => {
    wrapper = getTestComponent(user);

    const PageHeader = wrapper.dive().find('PageLayout').prop('PageHeader');
    const header = shallow(PageHeader.props.titleArea);
    const base = header.find('Link').first();
    expect(base.children().text()).to.equal('Customers');
    expect(base.prop('to')).to.equal('/admin/customers');

    const usersLink = header.find('Link').at(1);
    expect(usersLink.children().text()).to.equal('Users');
    expect(usersLink.prop('to')).to.equal('/admin/customers/users');

    const title = header.find('Link').at(2);
    expect(title.children().text()).to.equal(user.name);
  });

  it('Users Details Actions should be correct', () => {
    wrapper = getTestComponent(user);
    const PageHeader = wrapper.dive().find('PageLayout').prop('PageHeader');
    const actions = PageHeader.props.actions;
    expect(actions.length).to.equal(5);
  });

  it('Reset 2fa action should not be disabled if user is locked and admin has permission to unlock', () => {
    wrapper = getTestComponent(user);
    const PageHeader = wrapper.dive().find('PageLayout').prop('PageHeader');
    const actions = PageHeader.props.actions;
    expect(actions[1].disabled).to.be.false;
  });

  it("Reset 2fa attempts action should be disabled if admin don't have permission to unlock", () => {
    getUser.returns(Immutable.fromJS({ permissions: [] }));
    wrapper = getTestComponent(user);
    const PageHeader = wrapper.dive().find('PageLayout').prop('PageHeader');
    const actions = PageHeader.props.actions;
    expect(actions[1].disabled).to.be.true;
  });

  it('Reset 2fa attempts action should be disabled if admin have permission to unlock but user is unlocked', () => {
    user['lockedOut?'] = false;
    wrapper = getTestComponent(user);
    const PageHeader = wrapper.dive().find('PageLayout').prop('PageHeader');
    const actions = PageHeader.props.actions;
    expect(actions[1].disabled).to.be.true;
  });

  it('Force Password Reset action should be disabled if admin do not permission', () => {
    getUser.returns(Immutable.fromJS({ permissions: [] }));
    wrapper = getTestComponent(user);
    const PageHeader = wrapper.dive().find('PageLayout').prop('PageHeader');
    const actions = PageHeader.props.actions;
    expect(actions[0].disabled).to.be.true;
  });

  it('Force Password Reset action should be enabled if admin have permission', () => {
    wrapper = getTestComponent(user);
    const PageHeader = wrapper.dive().find('PageLayout').prop('PageHeader');
    const actions = PageHeader.props.actions;
    expect(actions[0].disabled).to.be.false;
  });

  it('should not render modals when is user undefined', () => {
    wrapper = getTestComponent(undefined);
    expect(wrapper.dive().find('Spinner').length).to.equal(1);
    expect(wrapper.dive().find('Reset2FAModal').length).to.equal(0);
    expect(wrapper.dive().find('ForcePasswordResetModal').length).to.equal(0);
    expect(wrapper.dive().find('TriggerNew2FAModal').length).to.equal(0);
  });
});
