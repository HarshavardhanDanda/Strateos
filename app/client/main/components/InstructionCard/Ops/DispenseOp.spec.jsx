import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';
import Immutable from 'immutable';
import { Param } from '@transcriptic/amino';

import ContainerTag from 'main/components/InstructionTags/ContainerTag.jsx';
import DispenseOp from './DispenseOp';

describe('DispenseOp', () => {
  it('should pass showTimeConstraint, instructionSequenceNo, showTimeConstraintDetail props to ContainerTag', () => {
    const instruction = {
      sequence_no: 0,
      operation: {
        op: 'dispense',
        object: 'foo',
        columns: []
      }
    };
    const run = Immutable.fromJS({
      refs: [{ name: 'foo', container_type: { id: 'ct12' } }]
    });

    const wrapper = shallow(<DispenseOp instruction={instruction} run={run} />);
    const containerTag = wrapper.find(Param).at(0).dive().find(ContainerTag);
    expect(containerTag.props().showTimeConstraint).to.be.true;
    expect(containerTag.props().showTimeConstraintDetail).to.be.true;
    expect(containerTag.props().instructionSequenceNo).to.equal(instruction.sequence_no);
  });
});
