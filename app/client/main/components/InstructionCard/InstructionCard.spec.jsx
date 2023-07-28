import React from 'react';
import Immutable from 'immutable';
import { shallow } from 'enzyme';
import { expect } from 'chai';
import { ExpandableCard, TextDescription } from '@transcriptic/amino';

import { buildTimeConstraintsObject  } from 'main/util/TimeConstraintUtil';
import InstructionCard from './InstructionCard';

const props = {
  instruction: Immutable.fromJS({
    id: 'i1aey3uu22zu5',
    sequence_no: 1,
    operation: {
      locations: [
        {
          transports: [
            {
              volume: '-10:microliter'
            },
            {
              volume: '10:microliter'
            }
          ],
          location: 'test-flat/0'
        }
      ],
      op: 'liquid_handle'
    }
  }),
  run: Immutable.fromJS({
    id: 'r1aey3uu22zu5',
    datasets: [],
    dependents: [],
    refs: []
  }),
  instructionNumber: 1,
  parentInstructionNumber: 2,
  pathInstructionId: 'i1aey3uu22zu5'
};

const instructionsOfTimeConstraints = [
  {
    sequence_no: 1,
    operation: {
      op: 'dispense',
    },
  },
  {
    sequence_no: 2,
    operation: {
      op: 'dispense',
    },
  }
];

describe('InstructionCard', () => {

  it('should display instruction number including parentInstructionNumber in the header', () => {
    const instructionCard = shallow(<InstructionCard {...props} />);
    const expandableCard = instructionCard.find(ExpandableCard);
    expect(expandableCard.dive().find('.expandable-card__head')
      .find('.instruction-card__title-index')
      .find(TextDescription)
      .at(0)
      .dive()
      .find('Text')
      .dive()
      .text()
    ).to.include(`${props.parentInstructionNumber}.${props.instructionNumber}`);
  });

  it('should display only instruction number if parentInstructionNumber is undefined', () => {
    const instructionCard = shallow(<InstructionCard {...props} parentInstructionNumber={undefined} />);
    const expandableCard = instructionCard.find(ExpandableCard);
    expect(expandableCard.dive().find('.expandable-card__head')
      .find('.instruction-card__title-index')
      .find(TextDescription)
      .at(0)
      .dive()
      .find('Text')
      .dive()
      .text()
    ).to.not.include(props.parentInstructionNumber);

    expect(expandableCard.dive().find('.expandable-card__head')
      .find('.instruction-card__title-index')
      .find(TextDescription)
      .at(0)
      .dive()
      .find('Text')
      .dive()
      .text()
    ).to.include(props.instructionNumber);
  });

  it('should show hour-glass start icon if there is a time constraint having provided instruction sequenceNo in "from" object', () => {
    const run = {
      id: 'r1aey3uu22zu5',
      time_constraints: [
        {
          from: {
            instruction_start: 1
          },
          to: {
            instruction_end: 2
          }
        }
      ],
      instructions: instructionsOfTimeConstraints
    };
    buildTimeConstraintsObject(run.instructions, run.time_constraints);
    const instructionCard = shallow(<InstructionCard {...props} run={Immutable.fromJS(run)} showTimeConstraint />);
    expect(instructionCard.find(ExpandableCard).dive().find('.expandable-card__head').find('Icon')
      .prop('icon')).to.be.equal('fa-regular fa-hourglass-start');
  });

  it('should show hour-glass end icon if there is a time constraint having provided instruction sequenceNo in "to" object', () => {
    const run = {
      id: 'r1aey3uu22zu5',
      time_constraints: [
        {
          from: {
            instruction_start: 0
          },
          to: {
            instruction_end: 1
          }
        }
      ],
      instructions: instructionsOfTimeConstraints
    };
    buildTimeConstraintsObject(run.instructions, run.time_constraints);
    const instructionCard = shallow(<InstructionCard {...props} run={Immutable.fromJS(run)} showTimeConstraint />);
    expect(instructionCard.find(ExpandableCard).dive().find('.expandable-card__head').find('Icon')
      .prop('icon')).to.be.equal('fa-regular fa-hourglass-end');
  });

  it('should show hour-glass half icon if there are two time constraint involving same instruction, one in "from" object and other in "to" object or vice-versa', () => {
    const run = {
      id: 'r1aey3uu22zu5',
      time_constraints: [
        {
          from: {
            instruction_start: 1
          },
          to: {
            instruction_end: 2
          }
        },
        {
          from: {
            instruction_start: 0
          },
          to: {
            instruction_end: 1
          }
        }
      ],
      instructions: instructionsOfTimeConstraints
    };
    buildTimeConstraintsObject(run.instructions, run.time_constraints);
    const instructionCard = shallow(<InstructionCard {...props} run={Immutable.fromJS(run)} showTimeConstraint />);
    expect(instructionCard.find(ExpandableCard).dive().find('.expandable-card__head').find('Icon')
      .prop('icon')).to.be.equal('fa-regular fa-hourglass-half');
  });
});
