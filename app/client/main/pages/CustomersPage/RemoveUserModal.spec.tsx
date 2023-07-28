import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import RemoveUserModal from './RemoveUserModal';

describe('RemoveUserModal', () => {
  let wrapper;

  afterEach(() => {
    wrapper.unmount();
  });

  it('should contain a SinglePaneModal', () => {
    wrapper = shallow(<RemoveUserModal modalId="RemoveUserModal" />);
    expect(wrapper.dive().find('SinglePaneModal')).to.length(1);
    wrapper.unmount();
  });

  it('should contain a RemoveUserModalContent', () => {
    wrapper = shallow(<RemoveUserModal modalId="RemoveUserModal" />);
    expect(wrapper.dive().find('RemoveUserModalContent')).to.length(1);
    wrapper.unmount();
  });
});
