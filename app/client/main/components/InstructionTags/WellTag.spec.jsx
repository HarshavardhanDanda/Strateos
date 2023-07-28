import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';
import Immutable from 'immutable';

import ContainerTag from 'main/components/InstructionTags/ContainerTag.jsx';
import WellTag from './WellTag';

describe('WellTag', () => {
  it('should pass showTimeConstraint, instructionSequenceNo props to ContainerTag', () => {
    const run = Immutable.fromJS({
      refs: [{ name: 'foo', container_type: { id: 'ct12' } }]
    });
    const instructionSequenceNo = 0;

    const wrapper = shallow(<WellTag run={run} refName={'test-ref-1'} instructionSequenceNo={instructionSequenceNo} />);
    const containerTag = wrapper.find(ContainerTag);
    expect(containerTag.props().showTimeConstraint).to.be.true;
    expect(containerTag.props().instructionSequenceNo).to.equal(instructionSequenceNo);
  });
});
