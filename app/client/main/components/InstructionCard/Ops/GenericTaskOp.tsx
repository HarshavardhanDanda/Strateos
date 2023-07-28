import { Param } from '@transcriptic/amino';
import React from 'react';
import StepsViewer from 'main/components/InstructionCard/StepsViewer';

function GenericTaskOp(props) {

  const { instruction } = props;

  const getTitle = () => {

    if (instruction?.operation?.steps?.length > 0) {
      return `Instructions (${instruction.operation.steps.length})`;
    }

    return 'Instructions (0)';
  };

  return (
    <ul className="generic-task-op params">
      <Param label="Intent" value={instruction?.operation?.task_label} />
      { instruction?.operation?.steps && (
        <StepsViewer
          steps={instruction.operation.steps}
          title={getTitle()}
        />
      )}
    </ul>
  );
}

export default GenericTaskOp;
