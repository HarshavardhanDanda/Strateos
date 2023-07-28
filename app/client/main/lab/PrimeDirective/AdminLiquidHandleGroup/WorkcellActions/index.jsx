import Classnames from 'classnames';
import Immutable from 'immutable';
import _ from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';

import ajax from 'main/util/ajax';
import { Tooltip, Icon } from '@transcriptic/amino';

function WorkcellActions({
  isHuman,
  onToggleHuman,
  onComplete,
  onSelect,
  onUndo,
  group,
  allowManual,
  WCselectedState,
  inProgress,
  setInProgress,
  isMarkAllCompleteInProgress,
  completionSnapshot = {},
  workcellsAvailable
}) {

  const onManualComplete = () => {
    setInProgress(true);
    const completeGroup = group.map(instruction => {
      return onComplete(instruction.get('id'));
    });

    ajax.when(...completeGroup)
      .always(() => setInProgress(false));
  };

  const isCompletingInstructions = () => {
    const isInstructionWithinGroup = group.some((instruction) => (instruction.get('id') === completionSnapshot.nextToComplete));
    return isMarkAllCompleteInProgress && isInstructionWithinGroup;
  };

  return (
    <div className="actions">
      {
        group.every(ins => !!ins.get('completed_at')) ? (
          <UndoAction
            group={group}
            onUndo={onUndo}
          />
        ) : (
          [
            <HumanExecutedAction
              key="human_executed"
              group={group}
              isHuman={isHuman}
              onToggleHuman={onToggleHuman}
            />,
            workcellsAvailable ? (
              <SelectedForWorkcellAction
                key="selected_for_workcell"
                group={group}
                WCselectedState={WCselectedState}
                onSelect={onSelect}
              />
            ) : undefined
          ]
        )}
      <div
        onClick={() => {
          return !allowManual ? alert('Allow manual completion to enable this button') : undefined;
        }}
      >
        <button
          className={Classnames(
            {
              'lab-checkbox': true,
              checked: group.every(ins => !!ins.get('completed_at'))
            }
          )}
          disabled={!allowManual}
          onClick={() => {
            onManualComplete();
          }}
        >
          {inProgress || isCompletingInstructions() ?
            <Icon icon="fa fa-spinner fa-spin" color="inherit" />
            : (
              <Tooltip
                placement="left"
                title="Manually mark this instruction as Complete, this can't be undone"
              >
                <Icon icon="fa fa-check" color="inherit" />
              </Tooltip>
            )}
        </button>
      </div>
    </div>
  );
}

WorkcellActions.propTypes = {
  group: PropTypes.instanceOf(Immutable.Iterable).isRequired,
  WCselectedState: PropTypes.object,
  isHuman: PropTypes.func,
  allowManual: PropTypes.bool,
  onToggleHuman: PropTypes.func.isRequired,
  onComplete: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired,
  onUndo: PropTypes.func.isRequired,
  inProgress: PropTypes.bool.isRequired,
  setInProgress: PropTypes.func.isRequired,
  isMarkAllCompleteInProgress: PropTypes.bool.isRequired,
  completionSnapshot: PropTypes.object.isRequired,
  workcellsAvailable: PropTypes.bool
};

function UndoAction({ onUndo, group }) {
  return (
    <div
      className="lab-checkbox"
      key="undo_instruction"
      onClick={() => group.forEach(ins => onUndo(ins.get('id')))}
    >
      <Tooltip
        placement="left"
        title="Undo this instruction group.  This simply sets completed_at to nil
               for all instructions, it does not undo aliquot effects."
      >
        <Icon icon="fa fa-undo" color="inherit" />
      </Tooltip>
    </div>
  );
}

UndoAction.propTypes = {
  group:  PropTypes.instanceOf(Immutable.Iterable).isRequired,
  onUndo: PropTypes.func.isRequired
};

function HumanExecutedAction({ isHuman, onToggleHuman, group }) {
  return (
    <div
      className={Classnames({
        checked: group.filterNot(ins => isHuman(ins)).size == 0,
        'lab-checkbox': true
      })}
      onClick={e => group.forEach(ins => onToggleHuman(ins, e))}
    >
      <Tooltip
        placement="left"
        title="Select this action to indicate the instruction will be completed manually rather than by robotics or instruments"
      >
        <Icon icon="fa fa-user" color="inherit" />
      </Tooltip>
    </div>
  );
}

HumanExecutedAction.propTypes = {
  group:           PropTypes.instanceOf(Immutable.Iterable).isRequired,
  isHuman:         PropTypes.func,
  onToggleHuman:   PropTypes.func.isRequired
};

function SelectedForWorkcellAction({ group, WCselectedState, onSelect }) {
  const allSelected = () => {
    return group.every(ins => !!WCselectedState[ins.get('sequence_no')]);
  };

  const onSelectAll = (e) => {
    const newAllSelectedState = !allSelected();

    group.forEach((ins) => {
      const instructionSelected = !!WCselectedState[ins.get('sequence_no')];
      if (instructionSelected !== newAllSelectedState) {
        onSelect(ins, e);
      }
    });
  };

  return (
    <div
      className={Classnames({
        checked: allSelected(),
        'lab-checkbox': true
      })}
      onClick={e => onSelectAll(e)}
    >
      <Tooltip
        placement="left"
        title="Select this instruction to be sent for scheduling, you can select more than one instruction"
      >
        <Icon icon="fa fa-cog" color="inherit" />
      </Tooltip>
    </div>
  );
}

SelectedForWorkcellAction.propTypes = {
  group:           PropTypes.instanceOf(Immutable.Iterable).isRequired,
  WCselectedState: PropTypes.object,
  onSelect:        PropTypes.func.isRequired
};

export default WorkcellActions;
