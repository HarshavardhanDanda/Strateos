import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import sinon from 'sinon';
import Immutable from 'immutable';
import { TextTitle } from '@transcriptic/amino';
import UserActions from 'main/actions/UserActions';
import ForcePasswordResetModal from './ForcePasswordResetModal';

describe('Force Password Reset Modal test', () => {
  let wrapper;
  const sandbox = sinon.createSandbox();

  const forcePasswordModal = (user) => {
    return (shallow(<ForcePasswordResetModal user={user} />));
  };

  afterEach(() => {
    if (wrapper) wrapper.unmount();
    if (sandbox) sandbox.restore();
  });

  it('should render singlepanemodal', () => {
    const user = Immutable.Map();
    wrapper = forcePasswordModal(user);
    const modal = wrapper.find('ConnectedSinglePaneModal');
    expect(modal.length).to.eq(1);
  });

  it('should have Force Password Reset as header for modal', () => {
    const user = Immutable.Map();
    wrapper = forcePasswordModal(user);
    const modal = wrapper.find('ConnectedSinglePaneModal');
    expect(modal.props().title).to.eq('Force Password Reset');
  });

  it('should have correct user email', () => {
    const user = Immutable.Map({ email: 'xyz@gmail.com' });
    wrapper = forcePasswordModal(user);
    const para = wrapper.find(TextTitle).dive().find('Text').dive()
      .find('h4');
    expect(para.children().text()).to.includes('<xyz@gmail.com>?');
  });

  it('should trigger forcePasswordReset api on submit', () => {
    const user = Immutable.Map({ email: 'xyz@gmail.com' });
    wrapper = forcePasswordModal(user);
    const spy = sandbox.spy(UserActions, 'forcePasswordReset');
    wrapper.instance().forcePasswordReset();
    expect(spy.calledOnce).to.be.true;
  });
});
