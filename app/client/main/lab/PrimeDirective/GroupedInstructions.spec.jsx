import React from 'react';
import Immutable from 'immutable';
import { shallow } from 'enzyme';

import sinon from 'sinon';
import { expect } from 'chai';

import GenericInstruction      from 'main/lab/PrimeDirective/GenericInstruction/GenericInstruction.tsx';
import GroupedInstructions from './GroupedInstructions';
import AdminLiquidHandleGroup from './AdminLiquidHandleGroup';
import ManageInstruction from './ManageInstruction';

describe('GroupedInstructions', () => {

  const props = {
    onToggleHuman: () => {},
    onComplete: () => {},
    onSelect: () => {},
    onUndo: () => {},
    isMarkAllCompleteInProgress: false,
    completionSnapshot: {}
  };

  it('should only render admin liquid handle group', () => {
    const groups = Immutable.fromJS([{
      type: 'foobar',
      instructions: [
        {
          id: 'i1aey3uty4hfc'
        }
      ]
    }]);
    const groupedInstructions = shallow(<GroupedInstructions {...props} instructionGroups={groups} />);

    const adminLiquidHandleGroup = groupedInstructions.find(AdminLiquidHandleGroup);
    const manageInstructions = groupedInstructions.find(ManageInstruction);

    expect(manageInstructions.length).to.be.equal(0);
    expect(adminLiquidHandleGroup.length).to.be.equal(1);
    expect(adminLiquidHandleGroup.props()).to.deep.equal({
      group: groups.getIn([0, 'instructions']),
      channel: 'foobar',
      instructionGroups: groups,
      instructionNumber: 1,
      onToggleHuman: props.onToggleHuman,
      onComplete: props.onComplete,
      onSelect: props.onSelect,
      onUndo: props.onUndo,
      isMarkAllCompleteInProgress: false,
      completionSnapshot: props.completionSnapshot
    });
  });

  it('should only manage instruction and pass instructionNumber to it', () => {
    const isHuman = sinon.stub().returns(true);
    const WCselectedState = {
      seq: false
    };
    const groups = Immutable.fromJS([{
      id: 'abc',
      type: 'foobar',
      sequence_no: 'seq'
    }]);
    const groupedInstructions = shallow(
      <GroupedInstructions
        {...props}
        instructionGroups={groups}
        WCselectedState={WCselectedState}
        isHuman={isHuman}
      />
    );

    const adminLiquidHandleGroup = groupedInstructions.find(AdminLiquidHandleGroup);
    const manageInstructions = groupedInstructions.find(ManageInstruction);

    expect(adminLiquidHandleGroup.length).to.be.equal(0);
    expect(manageInstructions.length).to.be.equal(1);
    expect(isHuman.calledOnce).to.be.true;
    expect(manageInstructions.props()).to.deep.equal({
      instructionNumber: 1,
      instruction: groups.getIn([0]),
      selectedForWorkcell: false,
      humanExecuted: true,
      instructionGroups: groups,
      WCselectedState,
      workcellsAvailable: true,
      isHuman,
      completionSnapshot: props.completionSnapshot,
      onToggleHuman: props.onToggleHuman,
      onComplete: props.onComplete,
      onSelect: props.onSelect,
      onUndo: props.onUndo,
      isMarkAllCompleteInProgress: false,
    });
  });

  it('should pass instructionNumber to the AdminLiquidHandleGroup', () => {
    const isHuman = sinon.stub().returns(true);
    const WCselectedState = {
      seq: false
    };
    const groups = Immutable.fromJS([{
      id: 'abc',
      type: 'foobar',
      sequence_no: 'seq',
      instructions: Immutable.fromJS([{
        id: 'test-id',
        type: 'test-type',
        sequence_no: 1
      }])
    }]);
    const groupedInstructions = shallow(
      <GroupedInstructions
        {...props}
        instructionGroups={groups}
        WCselectedState={WCselectedState}
        isHuman={isHuman}
      />
    );

    const adminLiquidHandleGroup = groupedInstructions.find(AdminLiquidHandleGroup);

    expect(adminLiquidHandleGroup.length).to.be.equal(1);
    expect(adminLiquidHandleGroup.prop('instructionNumber')).to.equal(1);
  });

  it('should pass instructionNumber to the GenericInstruction', () => {
    const isHuman = sinon.stub().returns(true);
    const WCselectedState = {
      seq: false
    };
    const groups = Immutable.fromJS([{
      id: 'abc',
      type: 'foobar',
      sequence_no: 'seq',
      operation: {
        op: 'generic_task'
      } }
    ]);
    const groupedInstructions = shallow(
      <GroupedInstructions
        {...props}
        instructionGroups={groups}
        WCselectedState={WCselectedState}
        isHuman={isHuman}
      />
    );

    const genericInstruction = groupedInstructions.find(GenericInstruction);

    expect(genericInstruction.length).to.be.equal(1);
    expect(genericInstruction.prop('instructionNumber')).to.equal(1);
  });
});
