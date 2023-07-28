import Immutable from 'immutable';

import { getSeqNumberOrRef } from './TaskIds';

const TIMING_POINT_INSTRUCTION_TYPES = Immutable.Set(['instruction_start', 'instruction_end']);
const TIMING_POINT_REF_TYPES         = Immutable.Set(['ref_start', 'ref_end']);
const TIMING_POINT_START_TYPES       = Immutable.Set(['instruction_start', 'ref_start']);

const taskIdFromSeqNoOrRef = (seqNoOrRef, tasks) => {
  return tasks
    .find(t => getSeqNumberOrRef(t) === `${seqNoOrRef}`)
    .get('id');
};

/*
  Converts a TimingPoint from the autoprotocol format to a format ready for the task graph view
  in: { "instruction_start": 0 }
  out: { startOf: "InstructionTask|0" }

  in: { "ref_end": "my-ref" }
  out: {"endOf": "SupplyTask|my-ref" }
*/
const reformatAPtimingPoint = (type, seqNoOrRef, fetchTasks, instructionTasks) => {
  const newType = TIMING_POINT_START_TYPES.has(type) ? 'startOf' : 'endOf';

  let newSeqNoOrRef;
  if (TIMING_POINT_INSTRUCTION_TYPES.has(type)) {
    newSeqNoOrRef = taskIdFromSeqNoOrRef(seqNoOrRef, instructionTasks);
  } else if (TIMING_POINT_REF_TYPES.has(type)) {
    newSeqNoOrRef = taskIdFromSeqNoOrRef(seqNoOrRef, fetchTasks);
  } else {
    throw new Error(`Unrecognized timing point type: ${type}`);
  }

  return [newType, newSeqNoOrRef];
};

/*
  Converts a time constraint from the autoprotocol format
  to a format ready for the task graph view:

  example in: { from: { "instruction_start": 0 }, to: { "ref_end": "my_ref" } }
  example out: { from: { startOf: "runId|InstructionTask|0" }, to: { endOf: "runId|SupplyTask|my_ref" } }
*/
const reformatAPtimeConstraint = (constraint, fetchTasks, instructionTasks) => {
  const mapTimingPoint = ([type, seqNoOrRef]) => {
    return reformatAPtimingPoint(type, seqNoOrRef, fetchTasks, instructionTasks);
  };

  // A timing point is a single key/val pair like {instruction_start: 0}.
  // Use mapEntries to extract that key/val and then pass it through the mapper.
  const from = constraint.get('from').mapEntries(mapTimingPoint);
  const to   = constraint.get('to').mapEntries(mapTimingPoint);

  return constraint.set('from', from).set('to', to);
};

const tasksInConstraint = (constraint) => {
  const id = timingPoint => timingPoint.first();

  const fromId = id(constraint.get('from'));
  const toId   = id(constraint.get('to'));

  return Immutable.Map({ from: fromId, to: toId });
};

const timingPointIsStart = (timingPoint) => {
  return timingPoint.has('startOf');
};

const timeConstraintsForTask = (taskId, taskGraph) => {
  return taskGraph
    .get('timeConstraints')
    .filter((constraint) => {
      const { from, to } = tasksInConstraint(constraint).toJS();
      return from === taskId || to === taskId;
    });
};

export {
  reformatAPtimeConstraint,
  tasksInConstraint,
  timingPointIsStart,
  timeConstraintsForTask
};
