import Immutable from 'immutable';
import _ from 'lodash';
import AutoprotocolUtil from 'main/util/AutoprotocolUtil';

const hasRefs = (instruction, refs) => {
  let hasAllRefs = true;
  const refNamesInInstruction = AutoprotocolUtil.containerNamesInOperation(instruction.get('operation'));

  for (let i = 0; i < refNamesInInstruction.length; i++) {
    const refName = refNamesInInstruction[i];
    const refIsInStore = refs.find(ref => ref.get('name') == refName) != undefined;

    if (!refIsInStore) {
      hasAllRefs = false;
      break;
    }
  }

  return hasAllRefs;
};

// NOTE: assumes instructions are sorted by sequence_no asc.
// Given a partial set of instructions of a run,
// return the first set of continuous ones, starting from the 0th instruction.
const orderedInstructionsWithRefNames = (instructions, refs) => {
  if (!Immutable.List.isList(refs)) return undefined;

  if (instructions.count() === 0 || instructions.first().get('sequence_no') != 0) {
    // We only want to start rendering the list from the first instruction onwards.
    return Immutable.List();
  }

  let previous;
  const continuous = instructions.takeWhile((instruction) => {
    const hasAllItsRefsLoaded = hasRefs(instruction, refs);
    const currentSequenceNo = instruction.get('sequence_no');

    if (currentSequenceNo == 0 && hasAllItsRefsLoaded) {
      previous = currentSequenceNo;
      return true;
    }

    const isNext = currentSequenceNo == previous + 1;
    previous = currentSequenceNo;
    return isNext && hasAllItsRefsLoaded;
  });

  return continuous.toList();
};

export default orderedInstructionsWithRefNames;
