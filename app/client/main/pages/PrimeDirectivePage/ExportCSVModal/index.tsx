import React, { useState } from 'react';
import Immutable from 'immutable';
import _ from 'lodash';
import { MultiStepModalWrapper }   from 'main/components/Modal';
import SelectInstructionTypePane from './SelectInstructionTypePane';
import ExportCsvPane from './ExportCsvPane';

const instructionTypeOptions = (instructions) => {
  const uniqueInstructions = new Set();
  const instructionTypes = [];
  instructions.forEach(instruction => {
    uniqueInstructions.add(instruction.getIn(['operation', 'op']));
  });

  Array.from(uniqueInstructions).sort().forEach((instruction: string)  => {
    const instructionName = instruction.split('_').map(word => _.capitalize(word)).join(' ');
    instructionTypes.push({ value: instruction, name: instructionName });
  });

  return instructionTypes;
};

function ExportCSVModal(props) {
  const [navIndex, setNavIndex] = useState(0);
  const [selectedInstructionType, setSelectedInstructionType] = useState(undefined);

  return (
    <MultiStepModalWrapper
      currPaneIndex={navIndex}
      paneIndexReporter={(i) => setNavIndex(i)}
      paneTitles={Immutable.List(['Select type', 'Export csv'])}
      title="Export instruction execution data"
      modalId={ExportCSVModal.MODAL_ID}
      modalSize="large"
      {...(navIndex === 1 && { scrollType: 'modal' })}
    >
      <SelectInstructionTypePane
        instructionTypeOptions={instructionTypeOptions(props.instructions)}
        onSelectInstructionType={setSelectedInstructionType}
        {...props}
      />
      <ExportCsvPane
        selectedInstructionType={selectedInstructionType}
        {...props}
      />
    </MultiStepModalWrapper>
  );
}
ExportCSVModal.MODAL_ID = 'ExportCSVModal';
export default ExportCSVModal;
