import React from 'react';
import Immutable from 'immutable';
import { shallow } from 'enzyme';
import { expect } from 'chai';
import sinon from 'sinon';

import { Card, ExpandableCard, TextDescription } from '@transcriptic/amino';
import ManageInstruction from 'main/lab/PrimeDirective/ManageInstruction';
import ContainerTags from 'main/components/InstructionCard/ContainerTags';
import ContainerTag from 'main/components/InstructionTags/ContainerTag.jsx';
import AcsControls from 'main/util/AcsControls';
import FeatureConstants from '@strateos/features';

import DataTag from 'main/components/InstructionTags/DataTag.jsx';
import GenericInstruction from './GenericInstruction';

const sandbox = sinon.createSandbox();

let component;

const genericInst = Immutable.fromJS({
  id: 'i1aey3uu22zu5',
  sequence_no: 29,
  operation: {
    task_label: 'Liquid Shake',
    steps: [
      'Fill the container upto 30ml',
      'Shake the container for 30 seconds'
    ],
    op: 'generic_task',
    x_human: true,
    dataref: 'skp2_test_plate_5 Data| 20200402_173455',
    containers: ['container_ref1', 'container_ref2']
  },
  completed_at: undefined,
  started_at: undefined,
  is_always_human: true,
  data_name: 'skp2_test_plate_5 Data| 20200402_173455',
  completed_by_human: false,
  warps: [],
});

const run = Immutable.fromJS({
  refs: [],
  id: 'r1efz73utc2dfj',
  datasets: [
    {
      instruction_id: 'i1aey3uu22zu5',
      attachments: [{ name: 'test-dataset' }],
    },
  ],
});

const props = {
  instruction: genericInst,
  run,
  showAdminInfo: true,
  instructionNumber: 1
};

afterEach(() => {
  if (component) component.unmount();
  if (sandbox) sandbox.restore();
});

describe('GenericInstruction', () => {
  it('should have generic instruction container', () => {
    component = shallow(
      <GenericInstruction {...props} />
    );

    expect(component.hasClass('generic-instruction'));
  });

  it('should have a card header showing task_label instruction_id along with instructionNumber', () => {
    const instructionNumber = 1;
    component = shallow(
      <GenericInstruction {...props} instructionNumber={instructionNumber} />
    );

    const expandableCard = component.find(ExpandableCard).dive();

    expect(
      expandableCard.find(TextDescription).children().at(0).text()
    ).to.include('1');

    expect(
      expandableCard.find(TextDescription).children().at(2).text()
    ).to.equal(
      genericInst.getIn(['operation', 'task_label']).toUpperCase()
    );
  });

  it('should show container tags if present on the card header', () => {
    component = shallow(
      <GenericInstruction {...props} />
    );

    const expandableCard = component.find(ExpandableCard).dive();
    let tags = expandableCard.find(ContainerTags);
    expect(tags.props()).to.deep.equal({
      instruction: genericInst,
      run: run,
    });

    tags = tags.dive();

    expect(tags.find(ContainerTag).length).to.equal(2);
    const containerTag1 = tags.find(ContainerTag).at(0);
    expect(containerTag1.prop('refName')).to.equal('container_ref1');
    const containerTag2 = tags.find(ContainerTag).at(1);
    expect(containerTag2.prop('refName')).to.equal('container_ref2');
  });

  it('should show DataTag if dataref is present', () => {
    component = shallow(
      <GenericInstruction {...props} />
    );

    const dataTag = component.find(ExpandableCard).dive().find(DataTag);
    expect(dataTag.length).to.equal(1);
    expect(dataTag.prop('refName')).to.equal(
      genericInst.getIn(['operation', 'dataref'])
    );
  });

  it('should not show DataTag if dataref is not present', () => {
    component = shallow(
      <GenericInstruction {...props} instruction={genericInst.setIn(['operation', 'dataref'], undefined)} />
    );

    const dataTag = component.find(ExpandableCard).dive().find(DataTag);
    expect(dataTag.length).to.equal(0);
  });

  it('should show uploaded text when there is a dataset for instruction', () => {
    sandbox
      .stub(AcsControls, 'isFeatureEnabled')
      .withArgs(FeatureConstants.SUBMIT_INSTRUCTIONS_TO_EXECUTE)
      .returns(true);
    component = shallow(
      <GenericInstruction {...props} />
    );

    const expandableCard = component.find(ExpandableCard).dive();

    expect(expandableCard.find('.instruction-card__uploaded')).to.have.length(1);
    expect(
      expandableCard.find('.instruction-card__uploaded').text()
    ).to.equal(' uploaded');
    expect(expandableCard.find('.instruction-card__uploaded').find('.fa-check')).to.have.length(
      1
    );
  });

  it('should not show uploaded text when there is no dataref for instruction', () => {
    component = shallow(
      <GenericInstruction
        {...props}
        instruction={genericInst.setIn(['operation', 'dataref'], undefined)}
      />
    );

    const expandableCard = component.find(ExpandableCard).dive();
    expect(expandableCard.find('.instruction-card__uploaded')).to.have.length(0);
  });

  it('should have a card body with generic instruction steps having instructionNumbers', () => {
    component = shallow(
      <GenericInstruction {...props} />
    );

    const expandableCard = component.find(ExpandableCard).dive();

    expandableCard.setState({ expanded: true });
    const genericInstructionSteps = expandableCard.find('.generic-instruction-step');
    expect(genericInstructionSteps.length).to.equal(2);
    expect(
      genericInstructionSteps
        .at(0)
        .find(Card)
        .dive()
        .find('.generic-instruction-step__head')
        .find(TextDescription)
        .at(0)
        .dive()
        .find('Text')
        .dive()
        .text()
    ).to.include('1.1');
    expect(
      genericInstructionSteps
        .at(0)
        .find(Card)
        .dive()
        .find('.generic-instruction-step__head')
        .find(TextDescription)
        .at(1)
        .dive()
        .find('Text')
        .dive()
        .text()
    ).to.include('Fill the container upto 30ml');
    expect(
      genericInstructionSteps
        .at(1)
        .find(Card)
        .dive()
        .find('.generic-instruction-step__head')
        .find(TextDescription)
        .at(0)
        .dive()
        .find('Text')
        .dive()
        .text()
    ).to.include('1.2');
    expect(
      genericInstructionSteps
        .at(1)
        .find(Card)
        .dive()
        .find('.generic-instruction-step__head')
        .find(TextDescription)
        .at(1)
        .dive()
        .find('Text')
        .dive()
        .text()
    ).to.include('Shake the container for 30 seconds');
  });

  it('should have ManageInstruction to show the actions', () => {
    component = shallow(
      <GenericInstruction {...props} />
    );

    const manageInstruction = component.find(ManageInstruction);

    expect(manageInstruction.exists()).to.be.true;
    expect(manageInstruction.prop('instruction')).to.deep.equal(genericInst);
    expect(manageInstruction.prop('showOnlyActions')).to.be.true;
  });

  it('should have pending class if the instruction is neither started nor completed', () => {
    component = shallow(
      <GenericInstruction {...props} />
    );

    expect(component.hasClass('pending'));
  });

  it('should have started class if the instruction is started', () => {
    component = shallow(
      <GenericInstruction
        {...props}
        instruction={genericInst.set(
          'started_at',
          '2022-09-16 08:06:23.117'
        )}
      />
    );

    expect(component.hasClass('started'));
  });

  it('should have completed class if the instruction is completed', () => {
    component = shallow(
      <GenericInstruction
        {...props}
        instruction={genericInst.set(
          'completed_at',
          '2022-09-16 08:06:23.117'
        )}
      />
    );

    expect(component.hasClass('completed'));
  });
});
