import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';
import Immutable from 'immutable';
import { ExpandableCard } from '@transcriptic/amino';
import InstructionCard  from 'main/components/InstructionCard/InstructionCard';

import LiquidHandleGroup from './LiquidHandleGroup';

describe('LiquidHandleGroup', () => {
  const props = {
    group: Immutable.fromJS([
      {
        sequence_no: 1,
        operation: {
          op: 'dispense',
        },
      }
    ]),
    run: Immutable.fromJS({
      refs: [{ name: 'foo', container_type: { id: 'ct12' } }]
    }),
    instructionNumber: 1,
    channel: 'test_channel'
  };

  it('should pass showTimeConstraint to the InstructionCard', () => {
    const wrapper = shallow(<LiquidHandleGroup {...props} />);
    wrapper.setState({ expanded: [true] });

    const expandableCard = wrapper.find(ExpandableCard).dive();
    expandableCard.setState({ expanded: true });
    expect(expandableCard.find(InstructionCard).props().showTimeConstraint).to.be.true;
  });
});
