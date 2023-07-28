import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';

import Header from './Header';

describe('Header', () => {

  let wrapper;

  const props = {
    title: 'Test Header',
    onClick: () => {}
  };

  afterEach(() => {
    wrapper.unmount();
  });

  it('should render', () => {
    wrapper = shallow(<Header {...props} />);
    expect(wrapper.find('h3').length).to.equal(1);
  });

  it('should render the Button component if showIcon is passed', () => {
    wrapper = shallow(<Header {...props} showIcon />);
    expect(wrapper.find('Button').length).to.equal(1);
  });

  it('should not render the Button component if showIcon is not passed', () => {
    wrapper = shallow(<Header {...props} />);
    expect(wrapper.find('Button').length).to.equal(0);
  });
});
