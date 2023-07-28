import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import Immutable from 'immutable';
import sinon from 'sinon';
import FeatureStore from 'main/stores/FeatureStore';
import FeatureConstants from '@strateos/features';
import { ActionMenu } from '@transcriptic/amino';
import UserAPI from 'main/api/UserAPI';
import UserDetailPage from './UserDetailPage';

describe('Users Detail Page test', () => {

  let wrapper;
  const sandbox = sinon.createSandbox();
  let getUserSpy;
  const user = {
    id: 'u18dcbwhctbnj',
    name: 'test1',
    email: 'test1@transcriptic.com',
    organizations: [{ name: 'Culver Industries' }, { name: 'Transcriptic' }, { name: 'Project-sol' }],
    featureGroups: ['pricing_breakdown', 'can_view_notebooks'],
    'lockedOut?': true
  };

  const usersFields = [
    'created_at',
    'email',
    'feature_groups',
    'first_name',
    'is_developer',
    'last_name',
    'name',
    'profile_img_url',
    'updated_at',
    'two_factor_auth_enabled',
    'locked_out?',
    'invitation_sent_at',
    'invitation_accepted_at',
    'last_sign_in_at',
    'last_sign_in_ip',
    'organizations'
  ];

  function getTestComponent(u) {
    return shallow(
      <UserDetailPage
        user={Immutable.fromJS(u)}
        match={{ params: { userId: 'u18dcbwhctbnj' } }}
      />
    );
  }

  beforeEach(() => {
    getUserSpy = sandbox.spy(UserAPI, 'get');
  });

  afterEach(() => {
    wrapper.unmount();
    sandbox.restore();
  });

  it('Users Detail should have Profile View when user prop is passed', () => {
    wrapper = getTestComponent(user);
    expect(wrapper.dive().find('ProfileView').length).to.equal(1);
  });

  it('should not render modals when user is undefined', () => {
    wrapper = getTestComponent(undefined);
    expect(wrapper.dive().find('Spinner').length).to.equal(1);
    expect(wrapper.dive().find('Reset2FAModal').length).to.equal(0);
    expect(wrapper.dive().find('ForcePasswordResetModal').length).to.equal(0);
    expect(wrapper.dive().find('TriggerNew2FAModal').length).to.equal(0);
  });

  it('Users Details Title should have correct links', () => {
    wrapper = getTestComponent(user);

    const PageHeader = wrapper.dive().find('PageLayout').prop('PageHeader');
    const header = shallow(PageHeader.props.titleArea);
    const base = header.find('Link').first();
    expect(base.children().text()).to.equal('Customers');
    expect(base.prop('to')).to.contain('/customers');
    const usersLink = header.find('Link').at(1);
    expect(usersLink.children().text()).to.equal('Users');
    expect(usersLink.prop('to')).to.contain('/customers/users');
    const title = header.find('Link').at(2);
    expect(title.children().text()).to.equal(user.name);
  });

  it('Users Detail page should have action menu if manage users global permission is present', () => {
    sandbox.stub(FeatureStore, 'hasPlatformFeature').withArgs(FeatureConstants.MANAGE_USERS_GLOBAL).returns(true);
    wrapper = getTestComponent(user);

    const pageHeader = wrapper.dive().find('PageLayout').dive().find('PageHeader');
    const actionProps = pageHeader.props().actions;

    expect(pageHeader.dive().find(ActionMenu).length).to.equal(1);
    expect(actionProps.length).to.equal(3);
  });

  it('Users Detail page should not have action menu if manage users global permission is not present', () => {
    wrapper = getTestComponent(user);

    const pageHeader = wrapper.dive().find('PageLayout').dive().find('PageHeader');
    const actionProps = pageHeader.props().actions;

    expect(pageHeader.dive().find(ActionMenu).length).to.equal(0);
    expect(actionProps).to.equal(undefined);
  });

  it('should call UserAPI with correct arguments in User Detail page', () => {
    wrapper = getTestComponent(user);
    wrapper.dive();
    const options = { includes: ['organizations'],
      fields: { users: usersFields }
    };
    expect(getUserSpy.calledOnce).to.be.true;
    expect(getUserSpy.calledWith(user.id, options)).to.be.true;
  });
});
