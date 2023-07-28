import React from 'react';
import { shallow } from 'enzyme';
import sinon from 'sinon';
import { expect } from 'chai';

import DetailPanel from './index';

describe('DetailPanel', () => {
  const sandbox = sinon.createSandbox();
  const props = {
    header: 'header',
    onClose: () => {}
  };
  let wrapper;
  let onClickSpy;

  beforeEach(() => {
    onClickSpy = sandbox.stub();
  });

  afterEach(() => {
    if (wrapper) wrapper.unmount();
    if (sandbox) sandbox.restore();
  });

  it('should call onClick prop when div element is clicked', () => {
    wrapper = shallow(<DetailPanel {...props} onClick={onClickSpy} />);
    wrapper.find('div').at(0).props().onClick();
    expect(onClickSpy.calledOnce).to.be.true;
  });
});
