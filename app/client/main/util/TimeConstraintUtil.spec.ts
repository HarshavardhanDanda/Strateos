import { expect } from 'chai';

import {
  getContainerCentricTimeConstraintType,
  TIME_CONSTRAINT_TYPE,
  buildTimeConstraintsObject,
  getInstructionCentricTimeConstraintType,
  getTimeConstraintIcon,
  getContainerCentricTimeConstraints
} from 'main/util/TimeConstraintUtil';
import { findInstructionHavingRef, } from 'main/util/InstructionUtil';

describe('TimeConstraintUtil', () => {
  const run = {
    id: 'foobar',
    time_constraints: [
      {
        to: {
          instruction_start: 1,
        },
        less_than: '1.0:minute',
        from: {
          ref_start: 'bacteria_stock',
        },
      },
      {
        to: {
          ref_end: 'reaction_plate',
        },
        less_than: '1.0:minute',
        from: {
          ref_start: 'reaction_plate',
        },
      },
      {
        to: {
          ref_end: 'bacteria_overgrow',
        },
        less_than: '1.0:minute',
        from: {
          instruction_end: 5
        },
      },
      {
        to: {
          instruction_start: 0,
        },
        less_than: '1.0:minute',
        from: {
          instruction_end: 2,
        },
      },
      {
        to: {
          instruction_start: 5,
        },
        less_than: '1.0:minute',
        from: {
          instruction_end: 3,
        },
      },
      {
        to: {
          instruction_start: 6,
        },
        less_than: '1.0:minute',
        from: {
          instruction_end: 5,
        },
      },
      {
        to: {
          ref_end: 'bacteria_stock',
        },
        less_than: '1.0:minute',
        from: {
          instruction_end: 1,
        },
      }
    ],
    instructions: [
      {
        sequence_no: 0,
        operation: {
          object: 'bacteria_prep',
          op: 'dispense',
        },
      },
      {
        sequence_no: 1,
        operation: {
          groups: [
            {
              transfer: [
                {
                  volume: '5.0:microliter',
                  to: 'bacteria_prep/0',
                  from: 'bacteria_stock/0',
                },
              ],
            },
          ],
          op: 'pipette',
        },
      },
      {
        sequence_no: 2,
        operation: {
          object: 'bacteria_prep',
          op: 'cover',
        },
      },
      {
        sequence_no: 3,
        operation: {
          object: 'bacteria_overgrow',
          op: 'dispense',
        },
      },
      {
        sequence_no: 4,
        operation: {
          object: 'reaction_plate',
          op: 'dispense',
        },
      },
      {
        sequence_no: 5,
        operation: {
          object: 'bacteria_overgrow',
          op: 'dispense',
        },
      },
      {
        sequence_no: 6,
        operation: {
          object: 'reaction_plate',
          op: 'dispense',
        },
      },
      {
        sequence_no: 7,
        operation: {
          object: 'no_tc_container',
          op: 'uncover',
        },
      }
    ],
  };

  beforeEach(() => {
    buildTimeConstraintsObject(run.instructions, run.time_constraints);
  });

  describe('getContainerCentricTimeConstraintType', () => {
    it('should return "to" if there is a time-constraint having ref_end in "to" object', () => {
      const refName = run.time_constraints[2].to.ref_end;

      // since ref is present in ref_end, instruction will be the last instruction having this ref
      const lastInstructionHavingRef = findInstructionHavingRef(run.instructions, refName, 'end');
      expect(
        getContainerCentricTimeConstraintType(lastInstructionHavingRef.sequence_no, refName)
      ).to.equal(TIME_CONSTRAINT_TYPE.TO);
    });

    it('should return "from" if there is a time-constraint having ref_start in "from" object', () => {
      const refName = run.time_constraints[1].from.ref_start;

      // since ref is present in ref_start, instruction will be the first instruction having this ref
      const firstInstructionHavingRef = findInstructionHavingRef(run.instructions, refName, 'start');
      expect(
        getContainerCentricTimeConstraintType(firstInstructionHavingRef.sequence_no, refName)
      ).to.equal(TIME_CONSTRAINT_TYPE.FROM);
    });

    it('should return "from_and_to" if there are two time constraints having same ref, one in "from" object and other in "to" object or vice-versa', () => {
      const refName = run.time_constraints[6].to.ref_end;

      // since ref is present in ref_end, instruction will be the last instruction having this ref
      const lastInstructionHavingRef = findInstructionHavingRef(run.instructions, refName, 'end');
      expect(
        getContainerCentricTimeConstraintType(lastInstructionHavingRef.sequence_no, refName)
      ).to.equal(TIME_CONSTRAINT_TYPE.FROM_AND_TO);
    });
  });

  describe('getInstructionCentricTimeConstraintType', () => {
    it('should return "to" if there is a time-constraint having instruction_start or instruction_end in "to" object', () => {
      const sequenceNo = run.time_constraints[3].to.instruction_start;

      expect(getInstructionCentricTimeConstraintType(sequenceNo)).to.equal(TIME_CONSTRAINT_TYPE.TO);
    });

    it('should return "from" if there is a time-constraint having instruction_start or instruction_end in "from" object', () => {
      const sequenceNo = run.time_constraints[4].from.instruction_end;

      expect(getInstructionCentricTimeConstraintType(sequenceNo)).to.equal(TIME_CONSTRAINT_TYPE.FROM);
    });

    it('should return "from_and_to" if there are two time constraints having same sequenceNos, one in "from" object and other in "to" object or vice-versa', () => {
      const seqeuenceNo1 = run.time_constraints[4].to.instruction_start;
      const seqeuenceNo2 = run.time_constraints[5].from.instruction_end;

      expect(seqeuenceNo1).to.equal(seqeuenceNo2);
      expect(getInstructionCentricTimeConstraintType(seqeuenceNo1)).to.equal(TIME_CONSTRAINT_TYPE.FROM_AND_TO);
    });
  });

  describe('getTimeConstraintIcon', () => {
    it('should return hourglass start icon if timeConstraintType is from', () => {
      expect(getTimeConstraintIcon(TIME_CONSTRAINT_TYPE.FROM)).to.equal(
        'fa-hourglass-start'
      );
    });

    it('should return hourglass end icon if timeConstraintType is to', () => {
      expect(getTimeConstraintIcon(TIME_CONSTRAINT_TYPE.TO)).to.equal(
        'fa-hourglass-end'
      );
    });

    it('should return hourglass half icon if timeConstraintType is to', () => {
      expect(getTimeConstraintIcon(TIME_CONSTRAINT_TYPE.FROM_AND_TO)).to.equal(
        'fa-hourglass-half'
      );
    });
  });

  describe('getContainerCentricTimeConstraints', () => {
    it('should return container centric time constraint for provided intruction sequenceNo and refName', () => {
      const expectedTimeConstraints = [run.time_constraints[1]];
      const refName = 'reaction_plate';
      const sequenceNo = 4;

      expect(getContainerCentricTimeConstraints(sequenceNo, refName).length).equal(1);
      expect(getContainerCentricTimeConstraints(sequenceNo, refName)).to.deep.equal(expectedTimeConstraints);
    });

    it('should not return any container centric time constraint if there is no one matches with the provided container', () => {
      const differentRefName = 'r2abc';
      const sequenceNo = 4;

      expect(getContainerCentricTimeConstraints(sequenceNo, differentRefName)).to.be.undefined;
    });

    it('should not return any container centric time constraint if there is no one matches with provided sequenceNo', () => {
      const refName = 'bacteria_overgrow';
      const sequenceNo = 7;

      expect(getContainerCentricTimeConstraints(sequenceNo, refName)).to.be.undefined;
    });

    it('should not return any time constraint if there are all instruction centric time constraints exists for a sequence_no', () => {
      const refName = 'bacteria_overgrow';

      expect(getContainerCentricTimeConstraints(0, refName)).to.be.undefined;
    });
  });
});
