import React from 'react';
import Immutable from 'immutable';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import sinon from 'sinon';

import RunInstructions from './RunInstructions';
import InstructionCard from './InstructionCard/InstructionCard';

describe('RunInstructions', () => {
  const sandbox = sinon.createSandbox();
  const run = Immutable.fromJS({
    refs: [],
    id: 'r1efz73utc2dfj',
    instructions: [
      {
        id: 'i1eesb84dcystk1',
        sequence_no: 'seq1'
      },
      {
        id: 'i1eesb84dcystk2',
        sequence_no: 'seq2'
      },
      {
        id: 'i1eesb84dcystk3',
        sequence_no: 'seq3'
      }
    ]
  });
  let wrapper;
  let groupInstructionsSpy;

  beforeEach(() => {
    groupInstructionsSpy = sandbox.spy(RunInstructions.prototype, 'groupedInstructions');
  });

  afterEach(() => {
    if (wrapper) wrapper.unmount();
    if (sandbox) sandbox.restore();
  });

  it('should render', () => {
    wrapper = shallow(<RunInstructions run={run} />);
  });

  it('should call groupedInstructions when run is updated', () => {
    wrapper = shallow(<RunInstructions run={run} />);
    expect(groupInstructionsSpy.calledOnce).to.be.true;
    wrapper.setProps({ run: run.set('instructions', run.get('instructions').slice(1)) });
    expect(groupInstructionsSpy.calledTwice).to.be.true;
  });

  it('should not call groupedInstructions when run is not updated', () => {
    wrapper = shallow(<RunInstructions run={run} />);
    expect(groupInstructionsSpy.calledOnce).to.be.true;
    wrapper.setProps({ run: run });
    expect(groupInstructionsSpy.calledOnce).to.be.true;
  });

  it('should pass showTimeConstraint prop to InstructionCard', () => {
    wrapper = shallow(<RunInstructions run={run} />);
    const instructionCard = wrapper.find(InstructionCard);
    expect(instructionCard.at(0).props().showTimeConstraint).to.be.true;
  });
});
