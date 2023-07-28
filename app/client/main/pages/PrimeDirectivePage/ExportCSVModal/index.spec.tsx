import React from 'react';
import { shallow } from 'enzyme';
import Immutable from 'immutable';
import { expect } from 'chai';
import ExportCSVModal from '.';
import SelectInstructionTypePane from './SelectInstructionTypePane';
import ExportCsvPane from './ExportCsvPane';

const instructions = [
  {
    id: 'testId_1',
    operation: {
      op: 'spin'
    }
  },
  {
    id: 'testId_2',
    operation: {
      op: 'sanger_sequence'
    }
  }
];

const expectedInstructionTypes = [
  { value: 'sanger_sequence', name: 'Sanger Sequence' },
  { value: 'spin', name: 'Spin' }
];

describe('ExportCSVModal', () => {
  let exportCsvModal;

  beforeEach(() => {
    exportCsvModal = shallow(<ExportCSVModal instructions={Immutable.fromJS(instructions)} />);
  });

  it('should have correct modal title and pane titles', () => {
    const props = exportCsvModal.props();
    expect(props.title).to.be.equal('Export instruction execution data');
    expect(props.paneTitles.toJS()).to.be.deep.equal(['Select type', 'Export csv']);
  });

  it('should pass props down and render the SelectInstructionTypePane', () => {
    const selectInstructionTypePane = exportCsvModal.find(SelectInstructionTypePane);
    expect(selectInstructionTypePane.length).to.equal(1);
    expect(selectInstructionTypePane.props().instructions.toJS()).to.be.deep.equal(instructions);
  });

  it('should create instruction type option based on the instructions passed as prop', () => {
    const selectInstructionTypePane = exportCsvModal.find(SelectInstructionTypePane);
    expect(selectInstructionTypePane.props().instructionTypeOptions).to.deep.equal(expectedInstructionTypes);
  });

  it('should pass props down and render the ExportCsvPane', () => {
    const exportCsvPane = exportCsvModal.find(ExportCsvPane);
    expect(exportCsvPane.length).to.equal(1);
    expect(exportCsvPane.props().instructions.toJS()).to.be.deep.equal(instructions);
  });
});
