import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import sinon from 'sinon';
import Immutable from 'immutable';
import FeatureConstants from '@strateos/features';
import InstructionCard from 'main/components/InstructionCard';

import AcsControls from 'main/util/AcsControls';
import ManageInstruction from './index';

describe('ManageInstruction', () => {
  let wrapper;
  const sandbox = sinon.createSandbox();

  beforeEach(() => {
    sandbox
      .stub(AcsControls, 'isFeatureEnabled')
      .withArgs(FeatureConstants.SUBMIT_INSTRUCTIONS_TO_EXECUTE)
      .returns(true);
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
    sandbox.restore();
  });

  const instruction = Immutable.fromJS({
    data_name: 'test',
    is_human_by_default: true,
    generated_containers: [],
    operation: {
      to: [{ volume: '16880:microliter', well: '1__1x Buffer Premix Tube/0' }],
      x_human: true,
      op: 'provision',
      resource_id: 'rs1b4xwqsnmx52'
    },
    completed_at: null,
    warps: [],
    started_at: null,
    completed_by_human: false,
    id: 'i1eesb84dcystk',
    completed_by_admin_id: null,
    sequence_no: 0
  });

  const run = Immutable.fromJS({
    refs: [],
    id: 'r1efz73utc2dfj',
    datasets: [{
      instruction_id: 'i1eesb84dcystk'
    }]
  });

  const provisionSpecs = Immutable.Iterable();

  const mount = (props) => {
    wrapper = shallow(
      <ManageInstruction
        instruction={instruction}
        run={run}
        provisionSpecs={provisionSpecs}
        onInstructionChange={() => {}}
        instructionNumber={1}
        {...props}
      />
    );
  };

  it('should render InstructionCard', () => {
    mount();
    expect(wrapper.find('InstructionCard')).to.have.lengthOf(1);
  });

  it('should pass showTimeConstraint prop to InstructionCard', () => {
    mount();
    expect(wrapper.find(InstructionCard).props().showTimeConstraint).to.be.true;
  });

  it('should render send to workcell action when workcells available', () => {
    mount();
    const icons = wrapper.find('Icon');
    const hasCogIcon = icons.map((icon) => icon.props().icon === 'fa fa-cog').includes(true);
    expect(hasCogIcon).to.equal(true);
  });

  it('should not render send to workcell action when workcells are not available', () => {
    mount({ workcellsAvailable: false });
    expect(wrapper.exists('.fa.fa-cog')).to.equal(false);
  });

  it('should have tooltip on each action', () => {
    mount();
    expect(wrapper.find('Tooltip')).to.have.lengthOf(3);
    expect(wrapper.find('InstructionDataUpload').dive().find('Tooltip')).to.have.lengthOf(1);
    expect(wrapper.find('ProvisionAction').dive().find('Tooltip')).to.have.lengthOf(1);
  });

  it('should have tooltip on the action when instruction op is flow_analyze', () => {
    mount({
      instruction: instruction.setIn(['operation', 'op'], 'flow_analyze')
    });
    expect(wrapper.find('FlowAnalyzeUploader').dive().find('Tooltip')).to.have.lengthOf(1);
  });

  it('should have tooltip on the action when instruction op is count_cells', () => {
    mount({
      instruction: instruction.setIn(['operation', 'op'], 'count_cells')
    });
    expect(wrapper.find('MeasureDataUploader').dive().find('Tooltip')).to.have.lengthOf(1);
  });

  it('should render GelPurifyInstructionButton when instruction op is gel_purify', () => {
    mount({
      instruction: instruction.setIn(['operation', 'op'], 'gel_purify')
    });
    expect(wrapper.find('GelPurifyInstructionButton')).to.have.lengthOf(1);
  });

  it('should render FlowAnalyzeUploader when instruction op is flow_analyze', () => {
    mount({
      instruction: instruction.setIn(['operation', 'op'], 'flow_analyze')
    });
    expect(wrapper.find('FlowAnalyzeUploader')).to.have.lengthOf(1);
  });

  it('should render MeasureDataUploader when instruction op is count_cells', () => {
    mount({
      instruction: instruction.setIn(['operation', 'op'], 'count_cells')
    });
    expect(wrapper.find('MeasureDataUploader')).to.have.lengthOf(1);
  });

  it('should render MeasureDataUploader when instruction op starts with measure', () => {
    mount({
      instruction: instruction.setIn(['operation', 'op'], 'measure test')
    });
    expect(wrapper.find('MeasureDataUploader')).to.have.lengthOf(1);
  });

  it('should render InstructionDataUpload when instruction op is not one of flow_analyze, count_cells or does not start with measure', () => {
    mount();
    expect(wrapper.find('InstructionDataUpload')).to.have.lengthOf(1);
  });

  it('should not render InstructionDataUpload when instruction data_name is empty', () => {
    mount({ instruction: instruction.set('data_name', undefined) });
    expect(wrapper.find('InstructionDataUpload')).to.have.lengthOf(0);
  });

  it('should render undo action when instruction is completed', () => {
    mount({ instruction: instruction.set('completed_at', new Date()) });
    const icons = wrapper.find('Icon');
    const hasCogIcon = icons.map((icon) => icon.props().icon === 'fa fa-cog').includes(true);
    const hasUserIcon = icons.map((icon) => icon.props().icon === 'fa fa-user').includes(true);
    const hasUndoIcon = icons.map((icon) => icon.props().icon === 'fa fa-undo').includes(true);

    expect(hasCogIcon).to.equal(false);
    expect(hasUserIcon).to.equal(false);
    expect(hasUndoIcon).to.equal(true);
  });

  it('should call onClickManualComplete when manual completion button is clicked', () => {
    const spy = sandbox.stub(ManageInstruction.prototype, 'onClickManualComplete').returns(() => {});

    mount();
    const manualCompleteButton = wrapper.find('button')
      .filterWhere(button => button.find('Tooltip')
        .filterWhere(tooltip => tooltip.prop('title') === 'Manually mark this instruction as Complete, this can\'t be undone')
      );
    manualCompleteButton.simulate('click');
    expect(spy.calledOnce).to.be.true;
  });

  it('should call onComplete only once when manual completion button is clicked multiple times', () => {
    const onComplete = sandbox.spy(() => ({
      always: () => {
        expect(onComplete.calledOnce).to.be.true;
      }
    }));

    mount({ onComplete });
    const manualCompletebutton = wrapper.find('button')
      .filterWhere(button => button.find('Tooltip')
        .filterWhere(tooltip => tooltip.prop('title') === 'Manually mark this instruction as Complete, this can\'t be undone')
      );

    manualCompletebutton.simulate('click');
    manualCompletebutton.simulate('click');
    manualCompletebutton.simulate('click');
  });

  it('should not show InstructionCard if showOnlyActions is true for a GenericInstruction', () => {
    mount({
      instruction: instruction.setIn(['operation', 'op'], 'generic_task'),
      showOnlyActions: true
    });
    expect(wrapper.find(InstructionCard)).to.have.lengthOf(0);
    expect(wrapper.find('.actions')).to.have.lengthOf(1);
  });

  it('should show InstructionCard if showOnlyActions is false for a GenericInstruction', () => {
    mount({
      instruction: instruction.setIn(['operation', 'op'], 'generic_task'),
      showOnlyActions: false
    });
    expect(wrapper.find(InstructionCard)).to.have.lengthOf(1);
    expect(wrapper.find('.actions')).to.have.lengthOf(1);
  });

  it('should show actions for GenericInstruction', () => {
    mount({
      instruction: instruction.setIn(['operation', 'op'], 'generic_task'),
      showOnlyActions: true,
      workcellsAvailable: true
    });
    const icons = wrapper.find('Icon');
    const hasCogIcon = icons.map((icon) => icon.props().icon === 'fa fa-cog').includes(true);
    const hasUserIcon = icons.map((icon) => icon.props().icon === 'fa fa-user').includes(true);
    const hasCheckIcon = icons.map((icon) => icon.props().icon === 'fa fa-check').includes(true);

    expect(hasCogIcon).to.equal(true);
    expect(hasUserIcon).to.equal(true);
    expect(hasCheckIcon).to.equal(true);
  });

  it('should show download as first action for GenericInstruction', () => {
    mount({
      instruction: instruction.setIn(['operation', 'op'], 'generic_task'),
      showOnlyActions: true,
      workcellsAvailable: true
    });
    const iconElements = wrapper.find('Icon');
    expect(iconElements.length).to.equal(4);
    expect(iconElements.at(0).props().icon).contains('fa fa-download');
    expect(iconElements.at(1).props().icon).contains('fa fa-user');
    expect(iconElements.at(2).props().icon).contains('fa fa-cog');
    expect(iconElements.at(3).props().icon).contains('fa fa-check');
  });

  it('should show HumanExecutedAction as checked by default for GenericInstruction', () => {
    mount({
      instruction: instruction.setIn(['operation', 'op'], 'generic_task'),
      showOnlyActions: true,
      workcellsAvailable: true
    });

    const icons = wrapper.find('Icon');
    const hasUserIcon = icons.map((icon) => icon.props().icon === 'fa fa-user').includes(true);

    const checked = wrapper.find('.checked');
    expect(hasUserIcon).to.equal(true);
    expect(checked.length).to.equal(1);
  });

  it('should show undo action when GenericInstruction is completed', () => {
    mount({
      instruction: instruction.setIn(['operation', 'op'], 'generic_task').set('completed_at', new Date()),
      showOnlyActions: true,
    });

    const icons = wrapper.find('Icon');
    const hasCogIcon = icons.map((icon) => icon.props().icon === 'fa fa-cog').includes(true);
    const hasUserIcon = icons.map((icon) => icon.props().icon === 'fa fa-user').includes(true);
    const hasUndoIcon = icons.map((icon) => icon.props().icon === 'fa fa-undo').includes(true);

    expect(hasCogIcon).to.equal(false);
    expect(hasUserIcon).to.equal(false);
    expect(hasUndoIcon).to.equal(true);
  });

  it('should call onClickManualComplete when manual completion button is clicked for a GenericInstruction', () => {
    const spy = sandbox.stub(ManageInstruction.prototype, 'onClickManualComplete').returns(() => {});

    mount({
      instruction: instruction.setIn(['operation', 'op'], 'generic_task'),
      showOnlyActions: true,
    });
    const manualCompleteButton = wrapper.find('button')
      .filterWhere(button => button.find('Tooltip')
        .filterWhere(tooltip => tooltip.prop('title') === 'Manually mark this instruction as Complete, this can\'t be undone')
      );
    manualCompleteButton.at(1).simulate('click');
    expect(spy.calledOnce).to.be.true;
  });

  it('should render download action when instruction op is generic', () => {
    mount({
      instruction: instruction.setIn(['operation', 'op'], 'generic_task')
    });
    wrapper.setState({ containerIds: ['ctr1'] });
    const icons = wrapper.find('Icon');
    const hasDownloadIcon = icons.map((icon) => icon.props().icon === 'fa fa-download manage-instruction__download-icon').includes(true);
    expect(hasDownloadIcon).to.equal(true);
  });

  it('should not render download action when instruction op is not generic', () => {
    expect(wrapper.exists('.fa.fa-download')).to.equal(false);
  });

  it('should call onClickManualComplete when isMarkAllCompleteInProgress is true and instruction matches', () => {
    const spy = sandbox.stub(ManageInstruction.prototype, 'onClickManualComplete').returns(() => { });
    const completionSnapshot = {
      totalNumberOfInstructions: 1,
      lastCompleted: '',
      lastCompletedIndex: -1,
      nextToComplete: instruction.get('id')
    };

    mount();
    wrapper.setProps({
      isMarkAllCompleteInProgress: true,
      completionSnapshot
    });
    wrapper.update();
    expect(spy.calledOnce).to.be.true;
  });

  it('should not call onClickManualComplete when already in progress', () => {
    const spy = sandbox.stub(ManageInstruction.prototype, 'onClickManualComplete').returns(() => { });
    const completionSnapshot = {
      totalNumberOfInstructions: 1,
      lastCompleted: '',
      lastCompletedIndex: -1,
      nextToComplete: instruction.get('id')
    };

    mount();
    wrapper.setState({ inProgress: true });
    wrapper.setProps({
      isMarkAllCompleteInProgress: true,
      completionSnapshot
    });
    wrapper.update();
    expect(spy.notCalled).to.be.true;
  });

  it('should not call onClickManualComplete when instruction is not a match', () => {
    const spy = sandbox.stub(ManageInstruction.prototype, 'onClickManualComplete').returns(() => { });
    const completionSnapshot = {
      totalNumberOfInstructions: 1,
      lastCompleted: '',
      lastCompletedIndex: -1,
      nextToComplete: 'is_not_a_match'
    };

    mount();
    wrapper.setProps({
      isMarkAllCompleteInProgress: true,
      completionSnapshot
    });
    wrapper.update();
    expect(spy.notCalled).to.be.true;
  });

  it('should abort any request when it is being unmounted', () => {
    const abortSpy = sandbox.spy();
    const fakeXhr = { abort: abortSpy };
    mount();
    wrapper.setState({
      inProgress: true,
      xhr: fakeXhr
    });
    wrapper.unmount();
    expect(abortSpy.calledOnce).to.be.true;
  });

  it('should pass instructionNumber, parentInstructionNumber to InstructionCard', () => {
    mount({
      instructionNumber: 1,
      parentInstructionNumber: 2
    });

    expect(wrapper.find(InstructionCard).prop('instructionNumber')).to.equal(1);
    expect(wrapper.find(InstructionCard).prop('parentInstructionNumber')).to.equal(2);
  });
});
