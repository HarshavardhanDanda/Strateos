import React from 'react';

import _ from 'lodash';
import { getInstructionCardTitle } from 'main/util/InstructionUtil';
import { Utilities, TextDescription } from '@transcriptic/amino';

function TimeConstraintDetail(props) {

  const { formatForDisplay } = Utilities.Units;

  const getInstructionTitle = (instSeqNo) => {
    const run = props.run;

    const instruction = run.get('instructions').find((inst) => inst.get('sequence_no') == instSeqNo);
    return getInstructionCardTitle(instruction.get('operation'));
  };

  const getTextFromInstructionTypeConstraint = (tc) => {
    let text;
    if (!_.isUndefined(tc.instruction_start)) {
      text = `Start of #${tc.instruction_start + 1} ${getInstructionTitle(tc.instruction_start)}`;
    } else {
      text = `End of #${tc.instruction_end + 1} ${getInstructionTitle(tc.instruction_end)}`;
    }
    return text;
  };

  const getTimeText = (timeConstraint) => {
    let text;
    if (timeConstraint.less_than) {
      text = `max ${formatForDisplay(timeConstraint.less_than)}`;
    } else if (timeConstraint.more_than) {
      text = `min ${formatForDisplay(timeConstraint.more_than)}`;
    } else {
      text = `equal ${formatForDisplay(timeConstraint.ideal?.value)}`;
    }
    return text;
  };

  const { timeConstraints } = props;

  const getText = (timeConstraint) => {
    let fromText = '';
    let toText = '';

    const toKeys = Object.keys(timeConstraint.to);
    const fromKeys = Object.keys(timeConstraint.from);

    if (fromKeys.includes('ref_start')) {
      fromText = 'taken out of storage';
    } else if (fromKeys.includes('instruction_start') || fromKeys.includes('instruction_end')) {
      fromText = getTextFromInstructionTypeConstraint(timeConstraint.from);
    }

    if (toKeys.includes('ref_end')) {
      toText = 'destination/discarded';
    } else if (toKeys.includes('instruction_start') || toKeys.includes('instruction_end')) {
      toText = getTextFromInstructionTypeConstraint(timeConstraint.to);
    }

    const time = getTimeText(timeConstraint);

    return `From ${fromText} to the ${toText} for container is ${time}`;
  };

  return (
    <div className="tx-stack tx-stack--xxxs">
      {timeConstraints.map((tc, index) => <TextDescription key={index}>{getText(tc)}</TextDescription>)}
    </div>
  );

}

export default TimeConstraintDetail;
