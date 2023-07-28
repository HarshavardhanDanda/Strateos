import React from 'react';
import Immutable from 'immutable';
import { shallow } from 'enzyme';
import { expect } from 'chai';
import sinon from 'sinon';
import UserActions  from 'main/actions/UserActions';
import ProfileView from './ProfileView';

describe('ProfileView', () => {

  let profileView;
  const sandbox = sinon.createSandbox();

  const user = Immutable.Map({
    id: 'u18dcbwhctbnj',
    name: 'test1',
    email: 'test1@transcriptic.com',
    organizations: [{ name: 'Culver Industries' }, { name: 'Transcriptic' }, { name: 'Project-sol' }],
    featureGroups: ['pricing_breakdown', 'can_view_notebooks'],
    'lockedOut?': true
  });

  it('should have TabLayout component', () => {
    profileView = shallow(<ProfileView user={user} />);
    expect(profileView.find('TabLayout').length).to.equal(1);
  });

  it('should have Header component', () => {
    profileView = shallow(<ProfileView user={user} />);
    expect(profileView.find('Header').length).to.equal(1);
  });

  it('should be able to edit name, email and confirm email', () => {
    profileView = shallow(<ProfileView user={user} />);

    profileView.find('Header').props().onIconClick();

    profileView.find('InputsController').props().inputChangeCallback({ name: 'new name',
      email: 'new@strateos.com',
      confirmEmail: 'new@strateos.com' });

    expect(profileView.find('TextInput').at(0).props().value).to.equal('new name');
    expect(profileView.find('TextInput').at(1).props().value).to.equal('new@strateos.com');
    expect(profileView.find('TextInput').at(2).props().value).to.equal('new@strateos.com');
  });

  it('should retain current name and email on clicking cancel button', () => {
    profileView = shallow(<ProfileView user={user} />);

    profileView.find('Header').props().onIconClick();

    profileView.find('InputsController').props().inputChangeCallback({ name: 'new name',
      email: 'new@strateos.com' });

    profileView.find('Footer').props().onCancel();
    profileView.find('Header').props().onIconClick();

    expect(profileView.state('editing')).to.equal(true);
    expect(profileView.find('TextInput').at(0).props().value).to.equal('test1');
    expect(profileView.find('TextInput').at(1).props().value).to.equal('test1@transcriptic.com');
  });

  it('should be able to update user information', () => {
    profileView = shallow(<ProfileView user={user} />);

    profileView.find('Header').props().onIconClick();

    const spy = sandbox.spy(UserActions, 'update');

    profileView.find('InputsController').props().inputChangeCallback({ name: 'new name',
      email: 'test1@transcriptic.com' });

    profileView.find('Footer').props().onSave(() => {});

    expect(spy.calledOnce).to.be.true;
  });
});
