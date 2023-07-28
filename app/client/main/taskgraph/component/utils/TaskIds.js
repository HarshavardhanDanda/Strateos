const SEPERATOR = '|';

export const makeTaskId = (run_id, type, seqNumberOrRef) => {
  return [run_id, type, seqNumberOrRef].join(SEPERATOR);
};

export const splitTaskId = (task) => {
  return task.get('id').split(SEPERATOR);
};

export const getSeqNumberOrRef = (task) => {
  const [_run_id, _type, seqNumberOrRef] = splitTaskId(task);

  return seqNumberOrRef;
};
