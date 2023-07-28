import PropTypes from 'prop-types';
import React     from 'react';

import Immutable from 'immutable';

import ManageInstruction       from 'main/lab/PrimeDirective/ManageInstruction';
import AdminLiquidHandleGroup  from 'main/lab/PrimeDirective/AdminLiquidHandleGroup';
import GenericInstruction      from 'main/lab/PrimeDirective/GenericInstruction/GenericInstruction.tsx';

function GroupedInstructions(props) {
  const { instructionGroups, WCselectedState, isHuman } = props;

  return (
    <div>
      {instructionGroups.map((group, index) => {

        const op = group.getIn(['operation', 'op']);

        if (group.get('instructions')) {
          return (
            <AdminLiquidHandleGroup
              {...props}
              instructionNumber={index + 1}
              key={group.getIn(['instructions', 0, 'id'])}
              group={group.get('instructions')}
              channel={group.get('type')}
            />
          );
        }

        if (op === 'generic_task') {
          return (
            <GenericInstruction
              {...props}
              instructionNumber={index + 1}
              showAdminInfo
              key={group.get('id')}
              instruction={group}
              selectedForWorkcell={WCselectedState[group.get('sequence_no')]}
              humanExecuted
            />
          );
        }

        return (
          <ManageInstruction
            {...props}
            instructionNumber={index + 1}
            key={group.get('id')}
            instruction={group}
            selectedForWorkcell={WCselectedState[group.get('sequence_no')]}
            humanExecuted={isHuman(group)}
          />
        );
      })}
    </div>
  );
}

GroupedInstructions.propTypes = {
  instructionGroups:   PropTypes.instanceOf(Immutable.Iterable).isRequired,
  WCselectedState:     PropTypes.object,
  isHuman:             PropTypes.func,
  onToggleHuman:       PropTypes.func.isRequired,
  onComplete:          PropTypes.func.isRequired,
  onSelect:            PropTypes.func.isRequired,
  onUndo:              PropTypes.func.isRequired,
  isMarkAllCompleteInProgress: PropTypes.bool.isRequired,
  completionSnapshot:  PropTypes.object.isRequired,
  run:                 PropTypes.instanceOf(Immutable.Map)
};

export default GroupedInstructions;
