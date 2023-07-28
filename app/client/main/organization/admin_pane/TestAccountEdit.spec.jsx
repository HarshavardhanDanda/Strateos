import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';

import TestAccountEdit from './TestAccountEdit';

describe('TestAccountEdit', () => {
  let wrapper;

  const props = {
    initialTestAccount: false,
    saveOrganization: () => {}
  };

  afterEach(() => {
    if (wrapper) wrapper.unmount();
  });

  it('should render', () => {
    wrapper = shallow(<TestAccountEdit {...props} />);
  });

  it('should update state testAccount on checkbox onChange', () => {
    wrapper = shallow(<TestAccountEdit {...props} />);
    expect(wrapper.find('input').props().checked).equals(undefined);
    wrapper.find('input').props().onChange({ target: { checked: true } });
    expect(wrapper.find('input').props().checked).equals('checked');
  });
});
