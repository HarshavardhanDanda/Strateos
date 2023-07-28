const getDatasetFromRun = (run, instructionId) => {
  return run.get('datasets').find(dataset => dataset.get('instruction_id') === instructionId);
};

export default getDatasetFromRun;
