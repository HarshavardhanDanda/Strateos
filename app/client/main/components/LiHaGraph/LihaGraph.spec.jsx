import React from 'react';
import { shallow } from 'enzyme';
import sinon from 'sinon';
import { expect } from 'chai';

import demo1 from 'main/components/LiHaGraph/test-data-1';
import demo2 from 'main/components/LiHaGraph/test-data-2';
import demo3 from 'main/components/LiHaGraph/test-data-3';
import demo4 from 'main/components/LiHaGraph/test-data-4';
import demo5 from 'main/components/LiHaGraph/test-data-5';

import LihaGraph from './LiHaGraph';

const demos = [demo1, demo2, demo3, demo4, demo5];

describe('LihaGraph', () => {

  let wrapper;
  let createDefaultStateStub;
  const sandbox = sinon.createSandbox();
  const props = {
    data: demos[0],
    sourceNodeWidth: 250,
    destinationNodeWidth: 500
  };

  beforeEach(() => {
    createDefaultStateStub = sandbox.stub(LihaGraph, 'createDefaultState');
  });

  afterEach(() => {
    if (wrapper) wrapper.unmount();
    sandbox.restore();
  });

  it('renders all example data', () => {
    demos.forEach((data) => {
      shallow(<LihaGraph data={data} />).unmount();
    });
  });

  it('should call createDefaultState when props are changed', () => {
    wrapper = shallow(<LihaGraph {...props} />);
    expect(createDefaultStateStub.calledOnce).to.be.true;
    wrapper.setProps({ ...props, destinationNodeWidth: 600 });
    expect(createDefaultStateStub.calledTwice).to.be.true;
  });

  it('should not call createDefaultState when props are not changed', () => {
    wrapper = shallow(<LihaGraph {...props} />);
    expect(createDefaultStateStub.calledOnce).to.be.true;
    wrapper.setProps({ ...props, destinationNodeWidth: 500 });
    expect(createDefaultStateStub.calledOnce).to.be.true;
  });
});
