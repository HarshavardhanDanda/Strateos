const taskHasRef = (task, refName) => {
  if (task.get('name') === 'InstructionTask') {
    return task.get('requiredObjects').has(refName);
  }
  return task.get('obj') === refName;
};

export default taskHasRef;
