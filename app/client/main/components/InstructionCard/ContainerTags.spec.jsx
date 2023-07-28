import React from 'react';
import Immutable from 'immutable';
import { expect } from 'chai';
import { shallow } from 'enzyme';

import ContainerTag from 'main/components/InstructionTags/ContainerTag.jsx';
import ContainerTags from './ContainerTags';

describe('ContainerTags', () => {
  let wrapper;
  const refName = 'test_ref_1';

  const instruction =  Immutable.fromJS({
    sequence_no: 0,
    operation: {
      object: refName,
      op: 'dispense'
    },
  });

  const props = {
    instruction: instruction,
    run: Immutable.fromJS({
      instructions: Immutable.fromJS([
        instruction
      ])
    })
  };

  it('should pass showTimeConstraint prop to ContainerTag', () => {
    wrapper = shallow(<ContainerTags {...props} />);
    const containerTag = wrapper.find(ContainerTag);
    expect(containerTag.props().showTimeConstraint).to.be.true;
  });

  it('should not pass showTimeConstraintDetail prop to ContainerTag', () => {
    wrapper = shallow(<ContainerTags {...props} />);
    const containerTag = wrapper.find(ContainerTag);
    expect(containerTag.props().showTimeConstraintDetail).to.be.undefined;
  });

  it('should pass instructionSequenceNo prop to ContainerTag', () => {
    wrapper = shallow(<ContainerTags {...props} />);
    const containerTag = wrapper.find(ContainerTag);
    expect(containerTag.props().instructionSequenceNo).to.equal(instruction.get('sequence_no'));
  });
});
