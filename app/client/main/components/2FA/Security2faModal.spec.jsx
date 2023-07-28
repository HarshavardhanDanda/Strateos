import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';
import Security2faModal from 'main/components/2FA/Security2faModal';

describe('Security 2FA Modal', () => {
  it('security 2fa modal should contain Single Pane Modal', () => {
    const wrapper = shallow(<Security2faModal  renderContent={() => {}} />);
    expect(wrapper.find('ConnectedSinglePaneModal')).to.length(1);
    wrapper.unmount();
  });
});
