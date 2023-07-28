const runIsFullJSON = (run) => {
  // Check to see if the most common relationships are present on the run, like instructions, refs, etc.
  // These relationships are currently included in the server response for Run.full_json.
  if (run == undefined) return false;

  const runExists = run.get('id') != undefined;
  const runHoldsInstructions = run.get('instructions') != undefined;
  const runHoldsRefs = run.get('refs') != undefined;
  const runHasQuoteBoolProperty = run.has('has_quote?');

  let runInstructionsHoldWarps = false;
  if (runHoldsInstructions) {
    const firstInstruction = run.getIn(['instructions', '0']);
    if (firstInstruction) {
      runInstructionsHoldWarps = firstInstruction.get('warps') != undefined;
    }
  }

  return runExists
    && runHoldsInstructions
    && runHoldsRefs
    && runHasQuoteBoolProperty
    && runInstructionsHoldWarps;
};

const instructionsLoadStatus = (instructions) => {
  if (instructions == undefined) return false;

  return instructions.size > 0;
};

const runLoadStatus = (run) => {
  if (run == undefined) return false;

  const runHasId = run.get('id') != undefined;
  const runHasDatasetsProperty = run.has('datasets');
  const runHasDependentsProperty = run.has('dependents');

  return runHasId
    && runHasDatasetsProperty
    && runHasDependentsProperty;
};

const refsLoadStatus = (refs) => {
  if (refs == undefined) return false;

  return refs.size > 0;
};

const loadStatus = (run) => {
  if (run == undefined) {
    return { runLoaded: false, instructionsLoaded: false, refsLoaded: false };
  }
  return {
    runLoaded: runLoadStatus(run),
    instructionsLoaded: instructionsLoadStatus(run.get('instructions')),
    refsLoaded: refsLoadStatus(run.get('refs'))
  };
};

export {
  runIsFullJSON,
  runLoadStatus,
  instructionsLoadStatus,
  refsLoadStatus
};

export default loadStatus;
