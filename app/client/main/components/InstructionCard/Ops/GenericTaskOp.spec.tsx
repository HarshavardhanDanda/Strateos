import React from 'react';

import { expect } from 'chai';
import { shallow } from 'enzyme';

import { Param } from '@transcriptic/amino';
import StepsViewer from 'main/components/InstructionCard/StepsViewer';
import GenericTaskOp from './GenericTaskOp';

describe('GenericTaskOp', () => {
  let wrapper;

  const genericInst = {
    id: 'i1aey3uu22zu5',
    sequence_no: 29,
    operation: {
      task_label: 'Liquid Shake',
      steps: [
        'Fill the container upto 30ml',
        'Shake the container for 30 seconds',
      ],
      op: 'generic_task',
      x_human: true,
      dataref: 'skp2_test_plate_5 Data| 20200402_173455',
      containers: ['container_ref1', 'container_ref2'],
    },
    completed_at: undefined,
    started_at: undefined,
    is_always_human: true,
    data_name: 'skp2_test_plate_5 Data| 20200402_173455',
    completed_by_human: false,
    warps: [],
  };

  beforeEach(() => {
    wrapper = shallow(
      <GenericTaskOp instruction={genericInst} />
    );
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
  });

  it('should render correctly', () => {
    expect(wrapper.find('.generic-task-op')).to.have.length(1);
  });

  it('should have an intent label and value should be task_label', () => {
    expect(wrapper.find(Param).prop('label')).to.equal('Intent');
    expect(wrapper.find(Param).prop('value')).to.equal(genericInst.operation.task_label);
  });

  it('should have StepsViewer and pass steps to it', () => {
    expect(wrapper.find(StepsViewer).exists()).to.be.true;
    expect(wrapper.find(StepsViewer).prop('steps')).to.equal(genericInst.operation.steps);
  });

  it('should pass number of instructions in the StepsViewer title', () => {
    expect(wrapper.find(StepsViewer).prop('title')).to.equal(
      `Instructions (${genericInst.operation.steps.length})`
    );
  });

  it('should show StepsViewer only if the steps exists', () => {
    const instructionWithoutSteps = { ...genericInst, operation: { ...genericInst.operation, steps: undefined } };
    wrapper = shallow(<GenericTaskOp instruction={instructionWithoutSteps} />);
    expect(wrapper.find(StepsViewer).exists()).to.be.false;
  });
});
