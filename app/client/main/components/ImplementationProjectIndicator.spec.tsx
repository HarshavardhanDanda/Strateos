import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import sinon from 'sinon';

import ImplementationProjectIndicator from './ImplementationProjectIndicator';

describe('ImplementationProjectIndicator', () => {
  let wrapper;
  const sandbox = sinon.createSandbox();

  afterEach(() => {
    if (wrapper) wrapper.unmount();
    if (sandbox) sandbox.restore();
  });

  it('should display icon', () => {
    wrapper = shallow(
      <ImplementationProjectIndicator />
    );
    expect(wrapper.find('Icon').props().icon).includes('fa-eye-slash');
  });

  it('should render tooltip', () => {
    wrapper = shallow(
      <ImplementationProjectIndicator />
    );
    expect(wrapper.find('Tooltip').props().title).to.equal('This is an implementation project');
  });

  it('should render with correct class when isHighlighted is false', () => {
    wrapper = shallow(
      <ImplementationProjectIndicator isHighlighted={false} />
    );
    expect(wrapper.find('Icon').dive().find('i').hasClass('implementation-project-indicator__eye-icon')).to.equal(true);
  });

  it('should call onClick when clicked on icon', () => {
    const onClickSpy = sinon.spy();
    wrapper = shallow(
      <ImplementationProjectIndicator
        onClick={onClickSpy}
      />
    );
    wrapper.find('Icon').simulate('click');
    expect(onClickSpy.calledOnce).to.equal(true);
  });

  it('should have "invert" as default color if there is no "isHighlighted" prop', () => {
    wrapper = shallow(
      <ImplementationProjectIndicator />
    );
    expect(wrapper.find('Icon').props().color).to.equal('invert');
    expect(wrapper.find('Icon').props().className).to.equal('');
  });

  it('should not display organization name by default', () => {
    wrapper = shallow(
      <ImplementationProjectIndicator />
    );
    expect(wrapper.find('TextBody').length).to.equal(0);
    expect(wrapper.find('Tooltip').props().title).to.equal('This is an implementation project');
  });

  it('should display organization name if exist', () => {
    wrapper = shallow(
      <ImplementationProjectIndicator organizationName="Strateos" />
    );
    expect(wrapper.find('TextBody').props().children).to.equal('Strateos');
    expect(wrapper.find('Tooltip').props().title).to.equal('This is a Strateos implementation project');
  });
});
