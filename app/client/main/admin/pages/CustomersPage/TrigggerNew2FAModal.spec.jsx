import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import Immutable from 'immutable';
import { Button } from '@transcriptic/amino';
import TriggerNew2FAModal from './TriggerNew2FAModal';

describe('Trigger new 2FA Modal view test', () => {
  let wrapper;

  function triggerNew2FA(user) {
    return (shallow(<TriggerNew2FAModal user={user} />));
  }

  afterEach(() => {
    if (wrapper) wrapper.unmount();
  });

  it('should render singlepanemodal', () => {
    const user = Immutable.Map();
    wrapper = triggerNew2FA(user);
    const modal = wrapper.find('ConnectedSinglePaneModal');
    expect(modal.length).to.eq(1);
  });

  it('should have a checkbox', () => {
    const user = Immutable.Map();
    wrapper = triggerNew2FA(user);
    const checkbox = wrapper.find('Checkbox');
    expect(checkbox.length).to.eq(1);
  });

  it('should have correct user email', () => {
    const user = Immutable.Map({ email: 'xyz@gmail.com' });
    wrapper = triggerNew2FA(user);
    const para = wrapper.find('p').first();
    expect(para.children().text()).to.includes('<xyz@gmail.com>?');
  });

  it('should have trigger new 2fa button', () => {
    const user = Immutable.Map();
    wrapper = triggerNew2FA(user);
    const button  = wrapper.find('ConnectedSinglePaneModal').props().footerRenderer();
    const buttonWrapper = shallow(button);
    const Reset2fa = buttonWrapper.find(Button).at(1);
    expect(Reset2fa.props().type).to.equals('danger');
    buttonWrapper.unmount();
  });

  it('trigger new 2fa button should be disabled if checkbox is not checked', () => {
    const user = Immutable.Map();
    wrapper = triggerNew2FA(user);
    const button  = wrapper.find('ConnectedSinglePaneModal').props().footerRenderer();
    const buttonWrapper = shallow(button);
    const Reset2fa = buttonWrapper.find(Button).at(1);
    expect(Reset2fa.props().disabled).to.be.true;
    buttonWrapper.unmount();
  });

  it('trigger new 2FA button is enabled if checkbox is checked', () => {
    const user = Immutable.Map();
    wrapper = triggerNew2FA(user);
    wrapper.setState({ checked: true });
    const button  = wrapper.find('ConnectedSinglePaneModal').props().footerRenderer();
    const buttonWrapper = shallow(button);
    const Reset2fa = buttonWrapper.find(Button).at(1);
    expect(Reset2fa.props().disabled).to.be.false;
    buttonWrapper.unmount();
  });

});
