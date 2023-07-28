import React from 'react';
import { mount, shallow } from 'enzyme';
import { expect } from 'chai';
import Immutable from 'immutable';
import { Param } from '@transcriptic/amino';

import ContainerTag from 'main/components/InstructionTags/ContainerTag.jsx';
import Agitate from './AgitateOp';

describe('AgitateOp', () => {
  it('temperature not provided', () => {
    const instruction = {
      operation: {
        op: 'agitate',
        object: 'foo',
        duration: '100:second',
        speed: '10.0:hertz',
        mode: 'vortex'
      }
    };
    const run = Immutable.fromJS({
      refs: [{ name: 'foo', container_type: { id: 'ct12' }  }]
    });

    const wrapper = mount(<Agitate instruction={instruction} run={run} />);
    const params = wrapper.find(Param);
    expect(params.length).to.equal(4);
    expect(params.find({ label: 'Temperature' })).to.have.lengthOf(0);
    wrapper.unmount();
  });

  it('temperature provided', () => {
    const instruction = {
      operation: {
        op: 'agitate',
        object: 'foo',
        duration: '100:second',
        speed: '10.0:hertz',
        mode: 'vortex',
        temperature: '100:celsius'
      }
    };
    const run = Immutable.fromJS({
      refs: [{ name: 'foo', container_type: { id: 'ct12' } }]
    });

    const wrapper = mount(<Agitate instruction={instruction} run={run} />);
    const params = wrapper.find(Param);
    expect(params.find({ label: 'Temperature' })).to.have.lengthOf(1);
    wrapper.unmount();
  });

  it('should pass showTimeConstraint, instructionSequenceNo, showTimeConstraintDetail props to ContainerTag', () => {
    const instruction = {
      sequence_no: 0,
      operation: {
        op: 'agitate',
        object: 'foo',
        duration: '100:second',
        speed: '10.0:hertz',
        mode: 'vortex',
        temperature: '100:celsius'
      }
    };

    const wrapper = shallow(<Agitate instruction={instruction} run={Immutable.fromJS({})} />);
    const containerTag = wrapper.find(Param).at(1).dive().find(ContainerTag);
    expect(containerTag.props().showTimeConstraint).to.be.true;
    expect(containerTag.props().showTimeConstraintDetail).to.be.true;
    expect(containerTag.props().instructionSequenceNo).to.equal(instruction.sequence_no);
  });
});
