import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';

import AjaxButton from './AjaxButton';

describe('AjaxButton', () => {
  let wrapper;

  const props = {
    action: () => {},
    loading: false,
    type: 'primary'
  };

  afterEach(() => {
    wrapper.unmount();
  });

  it('should render', () => {
    wrapper = shallow(<AjaxButton {...props} />);
    expect(wrapper.find('AjaxButton').dive().find('Button').length).to.eql(1);
  });

  it('should render with children prop when sent', () => {
    wrapper = shallow(
      <AjaxButton {...props}>
        <p>Test</p>
      </AjaxButton>
    );
    const button = wrapper.find('AjaxButton').dive().find('Button');
    expect(button.length).to.eql(1);
    expect(button.find('p').text()).to.eql('Test');
  });

  it('should render correctly when children prop is not sent', () => {
    wrapper = shallow(<AjaxButton {...props} />);
    const button = wrapper.find('AjaxButton').dive().find('Button');
    expect(button.length).to.eql(1);
    expect(wrapper.prop('children')).to.eql(undefined);
  });
});
