import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';
import Immutable from 'immutable';
import { Param } from '@transcriptic/amino';

import ContainerTag from 'main/components/InstructionTags/ContainerTag.jsx';
import MesoscaleSectorS600Card from './MesoscaleSectorS600Card';

describe('MesoscaleSectorS600Card', () => {
  it('should pass showTimeConstraint, instructionSequenceNo props to ContainerTag', () => {
    const instruction = {
      sequence_no: 0,
      operation: {
        op: 'seal',
        object: 'foo',
        assay: 'bar'
      }
    };

    const wrapper = shallow(<MesoscaleSectorS600Card instruction={instruction} run={Immutable.fromJS({})} />);
    const containerTag = wrapper.find(Param).find({ label: 'Object' }).dive().find(ContainerTag);
    expect(containerTag.props().showTimeConstraint).to.be.true;
    expect(containerTag.props().instructionSequenceNo).to.equal(instruction.sequence_no);
  });
});
