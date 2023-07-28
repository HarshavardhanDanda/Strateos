const completionStatus = (hasCompleted, hasStarted) => {
  if (hasCompleted) {
    return 'completed';
  } else if (hasStarted) {
    return 'started';
  } else {
    return 'pending';
  }
};

const getCompletionStatusFromInstruction = (instruction) => {
  const hasCompleted = instruction.get('completed_at') != undefined;
  const hasStarted   = instruction.get('started_at') != undefined;

  return completionStatus(hasCompleted, hasStarted);
};

const getCompletionStatusFromTask = (task, instructionList) => {
  if (task.get('name') !== 'InstructionTask') return undefined;

  const index       = task.get('sequenceNo');
  const instruction = instructionList.get(index);

  if (!instruction) {
    return undefined;
  }

  const hasCompleted = instruction.get('completed_at') != undefined;
  const hasStarted   = instruction.get('started_at') != undefined;
  return completionStatus(hasCompleted, hasStarted);
};

const instructionHelpers = {
  getCompletionStatusFromTask,
  getCompletionStatusFromInstruction
};

export default instructionHelpers;
