import React from 'react';
import Immutable from 'immutable';
import { shallow } from 'enzyme';
import { expect } from 'chai';

import { ExpandableCard, TextDescription } from '@transcriptic/amino';
import { liquidHandleGradientStyle } from 'main/util/InstructionUtil';
import ManageInstruction from 'main/lab/PrimeDirective/ManageInstruction';
import ContainerTags from 'main/components/InstructionCard/ContainerTags';

import AdminLiquidHandleGroup from './AdminLiquidHandleGroup';
import WorkcellActions from './AdminLiquidHandleGroup/WorkcellActions';

const liquidInst = {
  id: 'i1aey3uu22zu5',
  sequence_no: 29,
  operation: {
    locations: [
      {
        transports: [
          {
            volume: '-10:microliter'
          },
          {
            volume: '10:microliter'
          }
        ],
        location: 'test-flat/0'
      }
    ],
    op: 'liquid_handle'
  },
  completed_at: undefined,
  data_name: undefined,
  started_at: undefined,
  is_always_human: false,
  completed_by_human: false,
  warps: []
};

const props = {
  onToggleHuman: () => {},
  onComplete: () => {},
  onSelect: () => {},
  onUndo: () => {},
  isMarkAllCompleteInProgress: false,
  completionSnapshot: {}
};

describe('AdminLiquidHandleGroup', () => {
  it('should have manage instruction container', () => {
    const group = Immutable.fromJS([liquidInst]);
    const channel = 'foobar';

    const component = shallow(<AdminLiquidHandleGroup {...props} group={group} channel={channel} />);

    expect(component.hasClass('manage-instruction'));
  });

  it('should not be in progress', () => {
    const group = Immutable.fromJS([liquidInst]);
    const channel = 'foobar';

    const component = shallow(<AdminLiquidHandleGroup {...props} group={group} channel={channel} />);

    expect(component.state().inProgress).to.be.false;
  });

  it('should have a card header', () => {
    const group = Immutable.fromJS([liquidInst]);
    const channel = 'foobar';

    const component = shallow(<AdminLiquidHandleGroup {...props} group={group} channel={channel} />);

    const header = shallow(component.instance().cardHead());
    expect(header.find(TextDescription).children().at(0).text()).to.equal('Liquid Handle Group'.toUpperCase());
    const tags = header.find(ContainerTags);
    expect(tags.length).to.equal(1);
    expect(tags.props()).to.deep.equal({
      instruction: group.get(0),
      run: undefined
    });
  });

  it('should have a card body with one instruction', () => {
    const group = Immutable.fromJS([liquidInst]);
    const channel = 'foobar';

    const component = shallow(
      <AdminLiquidHandleGroup
        {...props}
        group={group}
        channel={channel}
        WCselectedState={{}}
        isHuman={() => true}
      />
    );

    const body = shallow(component.instance().cardBody());
    const manageInstruction = body.find(ManageInstruction);
    expect(manageInstruction.length).to.equal(1);
    expect(manageInstruction.prop('instruction')).to.deep.equal(group.get(0));
  });

  it('should shape text', () => {
    const group = Immutable.fromJS([
      {
        id: 'i1aey3uu22zu5',
        operation: { shape: { rows: 8, columns: 12 } }
      }
    ]);
    const channel = 'foobar';

    const component = shallow(
      <AdminLiquidHandleGroup
        {...props}
        group={group}
        channel={channel}
        WCselectedState={{}}
        isHuman={() => true}
      />
    );

    expect(component.instance().shapeText()).to.equal(' 8R X 12C');

    const header = shallow(component.instance().cardHead());
    expect(header.find(TextDescription).children().at(0).text()).to.equal('Liquid Handle Group'.toUpperCase());
  });

  it('should compute percent', () => {
    const group = Immutable.fromJS([liquidInst]);
    const channel = 'foobar';

    const component = shallow(
      <AdminLiquidHandleGroup
        {...props}
        group={group}
        channel={channel}
        WCselectedState={{}}
        isHuman={() => true}
      />
    );

    expect(component.instance().percentComplete()).to.equal(0);

    const moreGroup = Immutable.fromJS([
      liquidInst,
      { ...liquidInst, completed_at: new Date() }
    ]);
    component.setProps({ group: moreGroup });
    expect(component.instance().percentComplete()).to.equal(50);

    const moreGroup2 = Immutable.fromJS([
      { ...liquidInst, completed_at: new Date() },
      { ...liquidInst, completed_at: new Date() }
    ]);
    component.setProps({ group: moreGroup2 });
    expect(component.instance().percentComplete()).to.equal(100);
  });

  it('should render properly', () => {
    const group = Immutable.fromJS([liquidInst]);
    const channel = 'foobar';

    const component = shallow(
      <AdminLiquidHandleGroup
        {...props}
        group={group}
        channel={channel}
        WCselectedState={{}}
        isHuman={() => true}
      />
    );

    const expandableCard = component.find(ExpandableCard);
    expect(expandableCard.length).to.equal(1);
    expect(expandableCard.props()).to.deep.equal({
      className: 'instruction-card instruction-card-container liquid-handle-group',
      cardHead: component.instance().cardHead(),
      cardBody: component.instance().cardBody(),
      cardHeadStyle: {
        background: liquidHandleGradientStyle(0)
      },

      // amino has an expanded default attribute! Needs to be un-commented once the ExpandableCard component is updated
      expanded: false
    });

    const workcellActions = component.find(WorkcellActions);
    expect(workcellActions.length).to.equal(1);
    expect(component.state().inProgress).to.equal(false);
    expect(workcellActions.prop('inProgress')).to.equal(false);

    workcellActions.prop('setInProgress')(true);

    expect(component.state().inProgress).to.equal(true);
  });

  it('should display instruction number in the header', () => {
    const group = Immutable.fromJS([liquidInst]);
    const channel = 'foobar';
    const instructionNumber = 1;

    const component = shallow(
      <AdminLiquidHandleGroup
        {...props}
        group={group}
        channel={channel}
        WCselectedState={{}}
        isHuman={() => true}
        instructionNumber={instructionNumber}
      />
    );

    const expandableCard = component.find(ExpandableCard);

    expect(expandableCard.dive().find('.expandable-card__head')
      .find('.instruction-card__title-index')
      .find(TextDescription)
      .at(0)
      .dive()
      .find('Text')
      .dive()
      .text()
    ).to.include(instructionNumber);
  });

  it('should pass parent instruction number to ManageInstruction', () => {
    const group = Immutable.fromJS([liquidInst]);
    const channel = 'foobar';
    const instructionNumber = 1;

    const component = shallow(
      <AdminLiquidHandleGroup
        {...props}
        group={group}
        channel={channel}
        WCselectedState={{}}
        isHuman={() => true}
        instructionNumber={instructionNumber}
      />
    );
    const cardBody = shallow(component.instance().cardBody());

    expect(cardBody.find(ManageInstruction).prop('parentInstructionNumber')).to.equal(instructionNumber);
  });
});
