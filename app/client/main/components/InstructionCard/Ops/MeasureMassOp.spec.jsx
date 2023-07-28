import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';
import Immutable from 'immutable';
import { Param } from '@transcriptic/amino';

import ContainerTag from 'main/components/InstructionTags/ContainerTag.jsx';
import MeasureMassOp from './MeasureMassOp';

describe('MeasureMassOp', () => {
  it('should pass showTimeConstraint, instructionSequenceNo, showTimeConstraint props to ContainerTag', () => {
    const instruction = {
      sequence_no: 0,
      operation: {
        op: 'measure_mass',
        object: 'foo',
      }
    };

    const wrapper = shallow(<MeasureMassOp instruction={instruction} run={Immutable.fromJS({})} />);
    const containerTag = wrapper.find(Param).at(0).dive().find(ContainerTag);
    expect(containerTag.props().showTimeConstraint).to.be.true;
    expect(containerTag.props().showTimeConstraintDetail).to.be.true;
    expect(containerTag.props().instructionSequenceNo).to.equal(instruction.sequence_no);
  });
});
