import PropTypes from 'prop-types';
import React     from 'react';

import InstructionCard  from 'main/components/InstructionCard';
import { ContainerTag } from 'main/components/InstructionTags/index';
import RunStore         from 'main/stores/RunStore';

import './TimeConstraint.scss';

function InstructionTimeConstraint({ runId, timeConstraint }) {
  // will be ref_start, ref_end, instruction_start, instruction_end
  const fromConstraint = Object.keys(timeConstraint.from)[0];
  const toConstraint   = Object.keys(timeConstraint.to)[0];

  // Will be an instruction sequence number or a refname
  const fromValue = timeConstraint.from[fromConstraint];
  const toValue   = timeConstraint.to[toConstraint];

  // i.e 5.0:minute
  const time = timeConstraint.more_than || timeConstraint.less_than || timeConstraint.ideal.value;

  // instruction or ref
  const fromType = fromConstraint.split('_')[0];
  const toType   = toConstraint.split('_')[0];

  // start or end
  const from = fromConstraint.split('_')[1];
  const to   = toConstraint.split('_')[1];

  let comparator;
  if (timeConstraint.less_than) {
    comparator = '<';
  } else if (timeConstraint.more_than) {
    comparator = '>';
  } else if (timeConstraint.ideal) {
    comparator = '≈';
  }

  let fromNode;
  if (fromType == 'ref') {
    fromNode = <RefConstraint runId={runId} refName={fromValue} />;
  } else {
    fromNode = <InstructionConstraint runId={runId} instructionNumber={fromValue} />;
  }

  let toNode;
  if (toType == 'ref') {
    toNode = <RefConstraint runId={runId} refName={toValue} />;
  } else {
    toNode = <InstructionConstraint runId={runId} instructionNumber={toValue} />;
  }

  return (
    <div className="instruction-time-constraint">
      <span className="text-center">{`From ${from} of`}</span>
      {fromNode}
      <span className="text-center">{`to ${to} of`}</span>
      {toNode}
      <span className="text-center">{`${comparator} ${time.replace(':', ' ')}`}</span>
    </div>
  );
}

InstructionTimeConstraint.propTypes = {
  runId: PropTypes.string,
  timeConstraint: PropTypes.shape({
    from: PropTypes.object,
    to: PropTypes.object
  }).isRequired
};

function InstructionConstraint({ runId, instructionNumber }) {
  const run         = RunStore.getById(runId);
  const instruction = run.getIn(['instructions', instructionNumber]);

  return (
    <InstructionCard
      instruction={instruction}
      run={run}
      showAdminInfo
    />
  );
}

InstructionConstraint.propTypes = {
  runId: PropTypes.string.isRequired,
  instructionNumber: PropTypes.number.isRequired
};

function RefConstraint({ runId, refName }) {
  const run = RunStore.getById(runId);

  return (
    <ContainerTag refName={refName} run={run} />
  );
}

RefConstraint.propTypes = {
  runId: PropTypes.string.isRequired,
  refName: PropTypes.string.isRequired
};

export default InstructionTimeConstraint;
