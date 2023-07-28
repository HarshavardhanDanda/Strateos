import React from 'react';
import { shallow } from 'enzyme';
import Immutable from 'immutable';
import { expect } from 'chai';
import { Column, ModalStepFooter, Select, Table, TextBody } from '@transcriptic/amino';
import SelectInstructionTypePane from './SelectInstructionTypePane';

const instructions = [
  {
    id: '1',
    operation: {
      op: 'spin'
    },
    refs: [{
      container_id: 'c1'
    }]
  },
  {
    id: '2',
    operation: {
      op: 'sanger_sequence'
    },
    refs: [{
      container_id: 'c1'
    }]
  },
  {
    id: '3',
    operation: {
      op: 'sanger_sequence'
    },
    refs: [{
      container_id: 'c1'
    }]
  },
  {
    id: '4',
    operation: {
      op: 'spin'
    },
    refs: [{
      container_id: 'c1'
    }]
  },
  {
    id: '5',
    operation: {
      op: 'spin'
    },
    refs: [{
      container_id: 'c1'
    }]
  }
];

const instructionTypeOptions = [
  { value: 'sanger_sequence', name: 'Sanger Sequence' },
  { value: 'spin', name: 'Spin' }
];

describe('SelectInstructionTypePane', () => {
  let selectInstructionTypePane;

  beforeEach(() => {
    selectInstructionTypePane = shallow(<SelectInstructionTypePane
      instructions={Immutable.fromJS(instructions)}
      instructionTypeOptions={instructionTypeOptions}
    />);
  });

  it('should render table and select component', () => {
    const table = selectInstructionTypePane.find(Table);
    const columns = selectInstructionTypePane.find(Column);
    const select = selectInstructionTypePane.find(Select);

    expect(table.length).to.equal(1);
    expect(select.length).to.equal(1);
    expect(columns.length).to.equal(3);
    expect(columns.at(0).props().header).to.equal('Instruction name');
    expect(columns.at(1).props().header).to.equal('Containers');
    expect(columns.at(2).props().header).to.equal('Instruction ID');
  });

  it('should render filtered instructions in the table data', () => {
    const table = selectInstructionTypePane.find(Table);
    const filteredData = instructions.filter(ins => ins.operation.op === 'sanger_sequence');
    const bodyCells = table.dive().find('BodyCell');
    const modalStepFooter = selectInstructionTypePane.dive().find(ModalStepFooter);

    expect(table.props().data.toJS()).to.deep.equal(filteredData);
    expect(bodyCells.length).to.equal(filteredData.length * 3);

    for (let i = 0; i < filteredData.length; i++) {
      expect(bodyCells.at((3 * i)).childAt(0).dive().text()).to.equal(`Sanger Sequence ${i + 1}`);
      expect(bodyCells.at(1 + (3 * i)).childAt(0).dive().text()).to.equal(filteredData[i].refs[0].container_id);
      expect(bodyCells.at(2 + (3 * i)).childAt(0).dive().text()).to.equal(filteredData[i].id);
    }

    expect(modalStepFooter.dive().find(TextBody).childAt(0).text())
      .to.equal(`${filteredData.length} instructions`);
  });

  it('should be able to change instruction type option and filter the data', () => {
    const select = selectInstructionTypePane.find(Select);

    select.prop('onChange')({ target: { value: instructionTypeOptions[1].value } });
    expect(selectInstructionTypePane.find(Select).props().value).to.equal(instructionTypeOptions[1].value);

    const table = selectInstructionTypePane.find(Table);
    const filteredData = instructions.filter(ins => ins.operation.op === 'spin');
    const bodyCells = table.dive().find('BodyCell');
    const modalStepFooter = selectInstructionTypePane.dive().find(ModalStepFooter);

    expect(table.props().data.toJS()).to.deep.equal(filteredData);
    expect(bodyCells.length).to.equal(filteredData.length * 3);

    for (let i = 0; i < filteredData.length; i++) {
      expect(bodyCells.at((3 * i)).childAt(0).dive().text()).to.equal(`Spin ${i + 1}`);
      expect(bodyCells.at(1 + (3 * i)).childAt(0).dive().text()).to.equal(filteredData[i].refs[0].container_id);
      expect(bodyCells.at(2 + (3 * i)).childAt(0).dive().text()).to.equal(filteredData[i].id);
    }

    expect(modalStepFooter.dive().find(TextBody).childAt(0).text())
      .to.equal(`${filteredData.length} instructions`);
  });
});
