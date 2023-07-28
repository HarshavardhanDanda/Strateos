import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import Immutable from 'immutable';
import { TextBody } from '@transcriptic/amino';
import TriggerNew2FAModal from './TriggerNew2FAModal';

describe('Trigger new 2FA Modal view test', () => {
  let wrapper;

  const triggerNew2FA = (user) => {
    return (shallow(<TriggerNew2FAModal user={user} />));
  };

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
    const para = wrapper.find(TextBody).dive().find('Text').dive()
      .find('p');
    expect(para.children().text()).to.includes('<xyz@gmail.com>?');
  });

  it('should have trigger new 2fa button', () => {
    const user = Immutable.Map();
    wrapper = triggerNew2FA(user);
    const modal  = wrapper.find('ConnectedSinglePaneModal');
    expect(modal.props().acceptText).to.equals('Trigger New 2FA');
    expect(modal.props().type).to.equals('danger');
  });

  it('trigger new 2fa button should be disabled if checkbox is not checked', () => {
    const user = Immutable.Map();
    wrapper = triggerNew2FA(user);
    const modal  = wrapper.find('ConnectedSinglePaneModal');
    expect(modal.props().acceptBtnDisabled).to.be.true;
  });

  it('trigger new 2FA button is enabled if checkbox is checked', () => {
    const user = Immutable.Map();
    wrapper = triggerNew2FA(user);
    wrapper.setState({ checked: true });
    const modal  = wrapper.find('ConnectedSinglePaneModal');
    expect(modal.props().acceptBtnDisabled).to.be.false;
  });
});
