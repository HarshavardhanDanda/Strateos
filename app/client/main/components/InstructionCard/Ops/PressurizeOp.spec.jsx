import React from 'react';
import { mount } from 'enzyme';
import { expect } from 'chai';
import Immutable from 'immutable';
import { Param } from '@transcriptic/amino';
import { WellTag } from 'main/components/InstructionTags/index';

import Pressurize from './PressurizeOp';

describe('PressurizeOp', () => {
  it('should render minimal instruction', () => {
    const instruction = {
      operation: {
        op: 'pressurize',
        objects: ['w1/0'],
        duration: '100:minute',
        pressure: '10.0:bar'
      }
    };
    const run = Immutable.fromJS({
      refs: [{ name: 'foo' }]
    });

    const wrapper = mount(<Pressurize instruction={instruction} run={run} />);
    const params = wrapper.find(Param);
    expect(params.length).to.equal(3);
    wrapper.unmount();
  });

  it('should render when temperature provided', () => {
    const instruction = {
      operation: {
        op: 'pressurize',
        objects: ['w1/0'],
        duration: '100:minute',
        pressure: '10.0:bar',
        temperature: '100:celsius'
      }
    };
    const run = Immutable.fromJS({
      refs: [{ name: 'foo' }]
    });

    const wrapper = mount(<Pressurize instruction={instruction} run={run} />);
    const params = wrapper.find(Param);
    expect(params.find({ label: 'Temperature' })).to.have.lengthOf(1);
    wrapper.unmount();
  });

  it('should render when multiple wells provided', () => {
    const instruction = {
      operation: {
        op: 'pressurize',
        objects: ['w1/0', 'w2/1'],
        duration: '100:minute',
        pressure: '10.0:bar'
      }
    };
    const run = Immutable.fromJS({
      refs: [{ name: 'foo' }]
    });

    const wrapper = mount(<Pressurize instruction={instruction} run={run} />);
    const wellTag = wrapper.find(WellTag);
    expect(wellTag.length).to.be.equals(2);
    wrapper.unmount();
  });
});
