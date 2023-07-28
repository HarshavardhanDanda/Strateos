import React from 'react';
import Immutable from 'immutable';
import { shallow } from 'enzyme';
import { expect } from 'chai';
import SecurityView  from './SecurityView';

describe('Security View', () => {

  let securityView;

  const props = Immutable.Map({
    id: 'u19ahey7f2vyx',
    email: 'ben.miles@strateos.com',
    two_factor_auth_enabled: false
  });

  it('security view should have TabLayout component', () => {
    securityView = shallow(<SecurityView user={props} />);
    expect(securityView.find('TabLayout').length).to.equal(1);
  });

  it('security view should have Header component', () => {
    securityView = shallow(<SecurityView user={props} />);
    expect(securityView.find('Header').length).to.equal(1);
  });

  it('security view enable should render on load', () => {
    securityView = shallow(<SecurityView  user={props} />);
    expect(securityView.find('p').text())
      .to.contains('Two-factor authentication ("2FA") involves requiring a one-time code');
  });

  it('should be able to edit current, new, confirm new password', () => {
    securityView = shallow(<SecurityView  user={props} />);

    securityView.find('Header').props().onIconClick();

    securityView.find('InputsController').props().inputChangeCallback({ current_password: 'currentPassword',
      password: 'newPassword',
      password_confirmation: 'newPassword' });

    expect(securityView.find('TextInput').at(0).props().value).to.equal('currentPassword');
    expect(securityView.find('TextInput').at(1).props().value).to.equal('newPassword');
    expect(securityView.find('TextInput').at(2).props().value).to.equal('newPassword');
  });

  it('should clear current, new, confirm new password on clicking cancel button', () => {
    securityView = shallow(<SecurityView  user={props} />);
    securityView.find('Header').props().onIconClick();

    securityView.find('InputsController').props().inputChangeCallback({ current_password: 'currentPassword',
      password: 'newPassword',
      password_confirmation: 'newPassword' });

    securityView.find('Footer').props().onCancel();
    securityView.find('Header').props().onIconClick();

    expect(securityView.state('editing')).to.equal(true);
    expect(securityView.find('TextInput').at(0).props().value).to.equal('');
    expect(securityView.find('TextInput').at(1).props().value).to.equal('');
    expect(securityView.find('TextInput').at(2).props().value).to.equal('');
  });
});
