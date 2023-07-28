import React, { useState, useEffect } from 'react';
import _ from 'lodash';
import { MultiStepModalPane } from 'main/components/Modal';
import { Divider, TextBody, LabeledInput, Select, Table, Column } from '@transcriptic/amino';
import './SelectInstructionTypePane.scss';
import ModalActions from 'main/actions/ModalActions';
import BaseTableTypes from 'main/components/BaseTableTypes';
import ExportCSVModal from '.';

const instructionMessages = {
  selection: 'To get started, select instruction type to generate csv',
  table: 'Below is a list of all available instructions from your run ready for export'
};

const renderInstructionName = (row, instructionTypeName) => {
  return <BaseTableTypes.Text data={`${instructionTypeName} ${row + 1}`} />;
};

const renderInstructionId = (instruction) => {
  return <BaseTableTypes.Text data={instruction.get('id')} />;
};

const renderContainerId = (instruction) => {
  const containerIds = instruction.get('refs').map(ref => ref.get('container_id'));
  return <BaseTableTypes.Text data={containerIds.size > 0 ? containerIds.join(',') : '-'} />;
};

const renderNumberOfInstructionsFooter = (length) => {
  return <TextBody color="secondary" branded>{`${length} instructions`}</TextBody>;
};

function SelectInstructionTypePane(props) {
  const { instructions, instructionTypeOptions } = props;
  const [selectedInstructionType, setSelectedInstructionType] = useState(instructionTypeOptions[0].value);
  const filteredInstructions = instructions.filter(instruction => {
    return instruction.getIn(['operation', 'op']) === selectedInstructionType;
  });
  const selectedInstructionTypeOption = _.find(instructionTypeOptions, { value: selectedInstructionType });
  useEffect(() => {
    props.onSelectInstructionType(selectedInstructionType);
  }, [selectedInstructionType]);

  return (
    <MultiStepModalPane
      key="ExportCSVModalInstruction"
      cancelBtnClass="btn-heavy btn-standard btn-secondary"
      showCancel
      showBackButton={false}
      onDismiss={() => ModalActions.close(ExportCSVModal.MODAL_ID)}
      renderCustomLeftFooter={() => renderNumberOfInstructionsFooter(filteredInstructions.size)}
      {...props}
    >
      <div className="tx-stack tx-stack--sm">
        <TextBody color="secondary">{instructionMessages.selection}</TextBody>
        <LabeledInput label="Instruction type">
          <Select
            options={instructionTypeOptions}
            value={selectedInstructionType}
            fullWidth={false}
            onChange={e => setSelectedInstructionType(e.target.value)}
            className="select-instruction-type-pane--select"
          />
        </LabeledInput>
        <Divider isDark />
        <TextBody color="secondary">{instructionMessages.table}</TextBody>
        <div className="select-instruction-type-pane--table">
          <Table
            data={filteredInstructions}
            loaded
            id="instruction-table"
            disabledSelection
          >
            <Column renderCellContent={(_, row) => renderInstructionName(row, selectedInstructionTypeOption.name)} header="Instruction name" id="instruction-name" />
            <Column renderCellContent={renderContainerId} header="Containers" id="container-ids" />
            <Column renderCellContent={renderInstructionId} header="Instruction ID" id="instruction-id" />
          </Table>
        </div>
      </div>
    </MultiStepModalPane>
  );
}

export default SelectInstructionTypePane;
