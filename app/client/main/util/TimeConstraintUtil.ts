import _ from 'lodash';

import { findInstructionHavingRef } from 'main/util/InstructionUtil';

type Instruction = {
  [key: string]: number;
}

interface TimeConstraint {
  to: {
    instruction_end?: number;
    instruction_start?: number;
    ref_start?: string;
    ref_end?: string;
  },
  from: {
    instruction_end?: number;
    instruction_start?: number;
    ref_start?: string;
    ref_end?: string;
  },
  less_than?: string,
  more_than?: string,
  ideal?: {
    value: string
  }
}

type TimeConstraintType = 'from' | 'to' | 'from_and_to'

type TimeConstraintsOfInstructions = {
  [key: string]: {
    container_time_constraints?: {
      [key: string]: {
        timeConstraints: TimeConstraint[]
        type: TimeConstraintType;
      }
    },
    instruction_time_constraint?: {
      type: TimeConstraintType;
    }
  };
}

const TIME_CONSTRAINT_TYPE = {
  FROM: 'from' as TimeConstraintType,
  TO: 'to' as TimeConstraintType,
  FROM_AND_TO: 'from_and_to' as TimeConstraintType
};

let timeConstraintsOfInstructions: TimeConstraintsOfInstructions = {};

/*
 sets the container_time_constraints for the current sequenceNo and for different refs in the timeConstraintsOfInstructions object.
 This method is responsible for finding sequenceNo associated with the ref and assigning/updating the sequenceNo object.
*/
const setContainerTimeConstraints = (instructions: Instruction[], timeConstraintType: TimeConstraintType, timeConstraint: TimeConstraint) => {
  let currentInstruction: Instruction;

  if (timeConstraint[timeConstraintType].ref_start) {
    // if time constraint is having ref_start, then we need to find first instruction having the associated ref
    currentInstruction = findInstructionHavingRef(instructions, timeConstraint[timeConstraintType].ref_start, 'start');
  } else {
    // if time constraint is having ref_end, then we need to find last instruction having the associated ref
    currentInstruction = findInstructionHavingRef(instructions, timeConstraint[timeConstraintType].ref_end, 'end');
  }

  if (currentInstruction) {
    const { sequence_no } = currentInstruction;
    const currentRef = timeConstraint[timeConstraintType].ref_start || timeConstraint[timeConstraintType].ref_end;

    if (timeConstraintsOfInstructions[sequence_no]) {
      // if there are constraints already associated with this sequenceNo, we will just append to the existing object

      if (timeConstraintsOfInstructions[sequence_no].container_time_constraints) {
        // if there are container_time_constraints already associated with this sequenceNo,
        // we will just append to the existing container_time_constraints object

        if (
          timeConstraintsOfInstructions[sequence_no].container_time_constraints[currentRef] &&
          timeConstraintsOfInstructions[sequence_no].container_time_constraints[currentRef].type !== timeConstraintType
        ) {
          // if there's already a time constraint associated with this ref of different timeConstraintType
          // it means this ref is involved in multiple time constraints so update the previous type

          timeConstraintsOfInstructions[sequence_no].container_time_constraints[currentRef].type = TIME_CONSTRAINT_TYPE.FROM_AND_TO;
          timeConstraintsOfInstructions[sequence_no].container_time_constraints[currentRef].timeConstraints.push(timeConstraint);
        } else {
          // if there's no time_constraint associated with this ref, we will create a new ref object
          // and append it to the existing container_time_constraints object
          timeConstraintsOfInstructions[sequence_no].container_time_constraints[currentRef] = {
            type: timeConstraintType,
            timeConstraints: [timeConstraint]
          };
        }
      } else {
        // if there are no container_time_constraints associated with this sequenceNo, we will create a new container_time_constraints object
        timeConstraintsOfInstructions[sequence_no].container_time_constraints = {};

        // creates new ref object and assigns it to container_time_constraints object
        timeConstraintsOfInstructions[sequence_no].container_time_constraints[currentRef] = {
          type: timeConstraintType,
          timeConstraints: [timeConstraint]
        };
      }
    } else {
      // if there are no time constraints associated with this sequenceNo, the create all the objects and assign.
      timeConstraintsOfInstructions[sequence_no] = {
        container_time_constraints: {}
      };

      timeConstraintsOfInstructions[sequence_no].container_time_constraints[currentRef] = {
        type: timeConstraintType,
        timeConstraints: [timeConstraint]
      };
    }
  }
};

/*
 sets the instruction_time_constraint for the current sequenceNo
 in the timeConstraintsOfInstructions object.
*/
const setInstructionTimeConstraints = (timeConstraintType: TimeConstraintType, timeConstraint: TimeConstraint) => {
  let sequenceNo = timeConstraint[timeConstraintType].instruction_end;

  if (timeConstraint[timeConstraintType].instruction_start >= 0) {
    sequenceNo = timeConstraint[timeConstraintType].instruction_start;
  }

  if (timeConstraintsOfInstructions[sequenceNo]) {
    // if there are constraints already associated with this sequenceNo, we will just append to the existing object
    if (
      timeConstraintsOfInstructions[sequenceNo].instruction_time_constraint &&
      timeConstraintsOfInstructions[sequenceNo].instruction_time_constraint
        .type !== timeConstraintType
    ) {
      // if there's already a time constraint associated with this instruction of different timeConstraintType
      // it means this instruction is involved in multiple time constraints so update the previous type
      timeConstraintsOfInstructions[
        sequenceNo
      ].instruction_time_constraint.type = TIME_CONSTRAINT_TYPE.FROM_AND_TO;
    } else {
      // if there's no time_constraint associated with this instruction, we will create a new instruction object
      // and append it to the existing instruction_time_constraint object
      timeConstraintsOfInstructions[sequenceNo].instruction_time_constraint = {
        type: timeConstraintType,
      };
    }
  } else {
    // if there are no time constraints associated with this sequenceNo, the create all the objects and assign.
    timeConstraintsOfInstructions[sequenceNo] = {
      instruction_time_constraint: {
        type: timeConstraintType
      },
    };
  }
};

/*
 builds an object having instruction sequence numbers as keys
 and the values will be objects having container_time_constraints and instruction_time_constraint associated
 with the corresponding instructions.

 Example of the computed object:
 {
    "0": {
        "container_time_constraints": {
            "bacteria_prep": {
                "type": "to",
                 "timeConstraints":[{
                     "from": { "instruction_end": 0 },
                     "to": { "ref_end" : "bacteria_prep" },
                     "less_than": '3:hour'
                }]
             },
            "bacteria_stock": {
              "type": "from",
              "timeConstraints":[{
                     "from": { "ref_start": "bacteria_stock" },
                     "to": { "instruction_start" : 0 },
                     "less_than": '1:hour'
                }]
           }
        },
        "instruction_time_constraint": {
           "type": "from_and_to"
        }
    },
    "4": {
        "container_time_constraints": {
            "bacteria_overgrow": {
                "type": "from_and_to",
                 "timeConstraints": [{
                     "from": { "ref_start": "bacteria_overgrow" },
                     "to": { "ref_end" : "bacteria_overgrow" },
                     "less_than": '1:hour'
                }]
            }
        },
        "instruction_time_constraint": {
           "type": "from_and_to"
        }
    }
}

In the above example,
--> instruction with sequenceNo '0' is involved in three time constraints in which two are container_time_constraints for refs bacteria_prep, bacteria_stock
    and one is instruction_time_constraint.
--> instruction with sequenceNo '4' is involved in two time constraints in which one is container_time_constraint for ref bacteria_overgrow
    and one is instruction_time_constraint.
*/
const buildTimeConstraintsObject = (instructions, timeConstraints) => {
  timeConstraintsOfInstructions = {};

  if (!_.isEmpty(instructions) && !_.isEmpty(timeConstraints)) {
    const sortedInstructions = _.sortBy(instructions, (instruction) => instruction.sequence_no);

    timeConstraints.forEach((timeConstraint) => {
      const { to, from } = timeConstraint;
      const toKeys = Object.keys(to);
      const fromKeys = Object.keys(from);

      if (toKeys.includes('ref_start') || toKeys.includes('ref_end')) {
        setContainerTimeConstraints(sortedInstructions, TIME_CONSTRAINT_TYPE.TO, timeConstraint);
      }

      if (fromKeys.includes('ref_start') || fromKeys.includes('ref_end')) {
        setContainerTimeConstraints(sortedInstructions, TIME_CONSTRAINT_TYPE.FROM, timeConstraint);
      }

      if (toKeys.includes('instruction_start') || toKeys.includes('instruction_end')) {
        setInstructionTimeConstraints(TIME_CONSTRAINT_TYPE.TO, timeConstraint);
      }

      if (fromKeys.includes('instruction_start') || fromKeys.includes('instruction_end')) {
        setInstructionTimeConstraints(TIME_CONSTRAINT_TYPE.FROM, timeConstraint);
      }
    });
  }
};

const getContainerCentricTimeConstraintType = (sequenceNo: number, refName: string) => {
  if (timeConstraintsOfInstructions[sequenceNo] &&
    timeConstraintsOfInstructions[sequenceNo].container_time_constraints &&
    timeConstraintsOfInstructions[sequenceNo].container_time_constraints[refName]
  ) {
    return timeConstraintsOfInstructions[sequenceNo].container_time_constraints[refName].type;
  }
};

const getInstructionCentricTimeConstraintType = (sequenceNo: number) => {
  if (timeConstraintsOfInstructions[sequenceNo] &&
    timeConstraintsOfInstructions[sequenceNo].instruction_time_constraint
  ) {
    return timeConstraintsOfInstructions[sequenceNo].instruction_time_constraint.type;
  }
};

const getTimeConstraintIcon = (timeConstraintType: string) => {
  let timeConstraintIcon: string;
  switch (timeConstraintType) {
    case TIME_CONSTRAINT_TYPE.FROM:
      timeConstraintIcon = 'fa-hourglass-start';
      break;
    case TIME_CONSTRAINT_TYPE.TO:
      timeConstraintIcon = 'fa-hourglass-end';
      break;
    case TIME_CONSTRAINT_TYPE.FROM_AND_TO:
      timeConstraintIcon = 'fa-hourglass-half';
      break;
  }
  return timeConstraintIcon;
};

const getContainerCentricTimeConstraints = (sequenceNo: number, refName: string) => {
  if (timeConstraintsOfInstructions[sequenceNo] &&
    timeConstraintsOfInstructions[sequenceNo].container_time_constraints &&
    timeConstraintsOfInstructions[sequenceNo].container_time_constraints[refName]
  ) {
    return _.uniqWith(timeConstraintsOfInstructions[sequenceNo].container_time_constraints[refName].timeConstraints, _.isEqual);
  }
};

export {
  getContainerCentricTimeConstraintType,
  getInstructionCentricTimeConstraintType,
  buildTimeConstraintsObject,
  getTimeConstraintIcon,
  getContainerCentricTimeConstraints,
  TIME_CONSTRAINT_TYPE
};
