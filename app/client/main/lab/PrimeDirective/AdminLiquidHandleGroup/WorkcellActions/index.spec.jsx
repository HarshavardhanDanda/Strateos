import React             from 'react';
import { expect }        from 'chai';
import { shallow }       from 'enzyme';
import Immutable         from 'immutable';
import WorkcellActions   from './index';

describe('WorkCellActions test', () => {

  const group = Immutable.fromJS(
    [
      {
        data_name: null,
        is_human_by_default: false,
        generated_containers: [],
        operation: {
          locations: [],
          op: 'liquid_handle'
        },
        completed_at: '2021-07-23T15:06:51.036Z',
        warps: [],
        run_id: 'r1eynterdbu9n9',
        started_at: '2020-10-15T13:26:39.821-07:00',
        completed_by_human: false,
        id: 'i1eyntereh6kta',
        completed_by_admin_id: null,
        sequence_no: 5
      },
      {
        data_name: null,
        is_human_by_default: false,
        generated_containers: [],
        operation: {
          locations: [],
          op: 'liquid_handle'
        },
        completed_at: '2021-07-23T15:06:51.036Z',
        warps: [],
        run_id: 'r1eynterdbu9n9',
        started_at: '2020-10-15T13:26:39.884-07:00',
        completed_by_human: false,
        id: 'i1eynterepukff',
        completed_by_admin_id: null,
        sequence_no: 6
      }
    ]);

  const props = {
    onToggleHuman: () => {},
    onComplete: () => {},
    onSelect: () => {},
    onUndo: () => {},
    isMarkAllCompleteInProgress: false,
    completionSnapshot: {},
    inProgress: false,
    setInProgress: () => {}
  };

  let wrapper;

  it('should render undo action when all instructions are completed', () => {
    wrapper = shallow(<WorkcellActions {...props} group={group} />);
    expect(wrapper.find('UndoAction')).to.have.lengthOf(1);
  });

  it('should render actions when at least one instruction is not completed', () => {
    wrapper = shallow(<WorkcellActions {...props} group={group.setIn([0, 'completed_at'], null)} workcellsAvailable />);
    expect(wrapper.find('HumanExecutedAction')).to.have.lengthOf(1);
    expect(wrapper.find('SelectedForWorkcellAction')).to.have.lengthOf(1);
  });

  it('should have tooltips on actions', () => {
    wrapper = shallow(
      <WorkcellActions
        {...props}
        group={group.setIn([0, 'completed_at'], null)}
        workcellsAvailable
        WCselectedState={{}}
        isHuman={(_) => { return true; }}
        onSelect={() => {}}
      />);

    expect(wrapper.find('Tooltip')).to.have.lengthOf(1);
    expect(wrapper.find('HumanExecutedAction').dive().find('Tooltip')).to.have.lengthOf(1);
    expect(wrapper.find('SelectedForWorkcellAction').dive().find('Tooltip')).to.have.lengthOf(1);
  });

  it('should not render SelectedForWorkcellAction action when work cells are not available', () => {
    wrapper = shallow(
      <WorkcellActions
        {...props}
        group={group.setIn([0, 'completed_at'], null)}
      />
    );
    expect(wrapper.find('SelectedForWorkcellAction').exists()).to.be.false;
  });

  it('should show spinner on check action when marking all instructions complete and one of group instructions is queued', () => {

    const updatedGroup = group.map(instruction => {
      return instruction.set('completed_at', null);
    });
    wrapper = shallow(
      <WorkcellActions
        {...props}
        group={updatedGroup}
        workcellsAvailable
      />
    );
    expect(wrapper.find('Tooltip')).to.have.lengthOf(1);
    expect(wrapper.find('UndoAction')).to.have.lengthOf(0);
    wrapper.setProps({
      isMarkAllCompleteInProgress: true,
      completionSnapshot: {
        totalNumberOfInstructions: 2,
        lastCompleted: '',
        lastCompletedIndex: -1,
        nextToComplete: group.getIn([0, 'id'])
      }
    });
    wrapper.update();
    expect(wrapper.find('Tooltip')).to.have.lengthOf(0);
    wrapper.setProps({
      group: group,
      isMarkAllCompleteInProgress: true,
      completionSnapshot: {
        totalNumberOfInstructions: 2,
        lastCompleted: group.getIn([1, 'id']),
        lastCompletedIndex: -1,
        nextToComplete: ''
      }
    });
    wrapper.update();
    expect(wrapper.find('UndoAction')).to.have.lengthOf(1);
    expect(wrapper.find('Tooltip')).to.have.lengthOf(1);
  });

});
