import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import Immutable from 'immutable';
import { TextBody } from '@transcriptic/amino';
import Reset2FAModal from './Reset2FAModal';

describe('Reset 2FA Modal view test', () => {
  let wrapper;

  const reset2FAModal = (user) => {
    return (shallow(<Reset2FAModal user={user} />));
  };

  afterEach(() => {
    if (wrapper) wrapper.unmount();
  });

  it('should render singlepanemodal', () => {
    const user = Immutable.Map();
    wrapper = reset2FAModal(user);
    const modal = wrapper.find('ConnectedSinglePaneModal');
    expect(modal.length).to.eq(1);
  });

  it('should have a checkbox', () => {
    const user = Immutable.Map();
    wrapper = reset2FAModal(user);
    const checkbox = wrapper.find('Checkbox');
    expect(checkbox.length).to.eq(1);
  });

  it('should have correct user email', () => {
    const user = Immutable.Map({ email: 'xyz@gmail.com' });
    wrapper = reset2FAModal(user);
    const para = wrapper.find(TextBody).dive().find('Text').dive()
      .find('p');
    expect(para.children().text()).to.includes('<xyz@gmail.com>?');
  });

  it('should have reset 2fa attempts button', () => {
    const user = Immutable.Map();
    wrapper = reset2FAModal(user);
    const modal  = wrapper.find('ConnectedSinglePaneModal');
    expect(modal.props().acceptText).to.equals('Reset 2FA Attempts');
    expect(modal.props().type).to.equals('danger');
  });

  it('reset 2fa attempts button should be disabled if checkbox is not checked', () => {
    const user = Immutable.Map();
    wrapper = reset2FAModal(user);
    const modal  = wrapper.find('ConnectedSinglePaneModal');
    expect(modal.props().acceptBtnDisabled).to.be.true;
  });

  it('reset 2fa button is enabled if checkbox is checked', () => {
    const user = Immutable.Map();
    wrapper = reset2FAModal(user);
    wrapper.setState({ checked: true });
    const modal  = wrapper.find('ConnectedSinglePaneModal');
    expect(modal.props().acceptBtnDisabled).to.be.false;
  });
});
