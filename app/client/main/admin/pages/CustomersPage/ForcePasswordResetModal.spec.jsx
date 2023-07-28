import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import sinon from 'sinon';
import Immutable from 'immutable';
import AdminUserActions from 'main/admin/actions/UserActions';
import ForcePasswordResetModal from './ForcePasswordResetModal';

describe('Reset 2FA Modal view test', () => {
  let wrapper;
  const sandbox = sinon.createSandbox();

  function forcePasswordModal(user) {
    return (shallow(<ForcePasswordResetModal user={user} />));
  }

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
    const para = wrapper.find('p').first();
    expect(para.children().text()).to.includes('<xyz@gmail.com>?');
  });

  it('should trigger forcePasswordReset api on submit', () => {
    const user = Immutable.Map({ email: 'xyz@gmail.com' });
    wrapper = forcePasswordModal(user);
    const spy = sandbox.spy(AdminUserActions, 'forcePasswordReset');
    wrapper.instance().forcePasswordReset();
    expect(spy.calledOnce).to.be.true;
  });
});
