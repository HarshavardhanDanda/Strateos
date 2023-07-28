import React, { useState } from 'react';
import Immutable from 'immutable';
import _ from 'lodash';
import { MultiStepModalPane } from 'main/components/Modal';
import {  TextSubheading, Table, Column as TableColumn, Button, Spinner } from '@transcriptic/amino';
import ModalActions from 'main/actions/ModalActions';
import BaseTableTypes from 'main/components/BaseTableTypes';
import ExecutionSupportArtifactActions  from 'main/actions/ExecutionSupportArtifactActions';
import NotificationActions from 'main/actions/NotificationActions';
import moment from 'moment';
import ExportCSVModal from './';
import './ExportCsvPane.scss';

const renderCsvName = (esa) => {
  return <BaseTableTypes.Text data={esa.get('name')} />;
};

const renderCsvGeneratedOn = (esa) => {
  return (
    <BaseTableTypes.Text data={moment(esa.get('created_at')).format('MM/DD/YY, h:mm A')} />
  );
};

type Props = {
  instructions: Immutable.List<Immutable.Map<string, unknown>>,
  runId: string,
  selectedInstructionType: string
}

function ExportCsvPane(props: Props) {
  const { instructions, runId, selectedInstructionType } = props;
  const [selectedArtifacts, setSelectedArtifacts] = useState([]);
  const [initialDataLoading, setInitialDataLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [recordCount, setRecordCount] = useState(0);
  const [esaTableData, setEsaTableData] = useState([]);
  const [sortKey, setSortKey] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');
  const instructionsWithESA = instructions.filter((instruction) => {
    return instruction.getIn(['operation', 'op']) === selectedInstructionType;
  });
  const instructionIds = instructionsWithESA.map((ins) => ins.get('id'));

  React.useEffect(() => {
    fetch();
  }, [sortKey, sortDirection]);

  const fetch = (isFirstCall = true) => {
    const limit = 12;
    const offset = isFirstCall ? 0 : esaTableData.length;

    ExecutionSupportArtifactActions.fetchExecutionSupportArtifacts(runId, instructionIds, sortKey, sortDirection, limit, offset)
      .done((response) => {
        const artifacts = response && response.data.map((esa) => ({ id: esa.id, ...esa.attributes }));
        if (isFirstCall) {
          setEsaTableData(artifacts);
          setRecordCount(response.meta.record_count);
          setInitialDataLoading(false);
        } else {
          setEsaTableData(prevState => prevState.concat(artifacts));
          setDataLoading(false);
        }
      }).fail(() => {
        setInitialDataLoading(false);
        setDataLoading(false);
      });
  };

  const regenerateExecutionSupportArtifact = (next) => {
    const operation = selectedInstructionType;
    ExecutionSupportArtifactActions.regenerateExecutionSupportArtifact(runId, instructionIds, operation)
      .done(() => {
        fetch();
        next();
      })
      .fail(() => next());
  };

  const onScroll = (event) => {
    if (!dataLoading && recordCount !== esaTableData.length) {
      const { scrollTop, scrollHeight, clientHeight } = event.target;
      if (scrollTop + clientHeight >= scrollHeight) {
        setDataLoading(true);
        !initialDataLoading && fetch(false);
      }
    }
  };

  const downloadSelectedEsa = () => {
    ModalActions.close(ExportCSVModal.MODAL_ID);
    NotificationActions.createNotification({
      text: 'Downloading run instruction execution file. Your download should automatically start within seconds. If it does not, restart the download.' });

    selectedFiles.forEach((selectedEsaId, index) => {
      const esa = esaTableData.find(esa => esa.id === selectedEsaId);
      if (esa) {
        var link = document.createElement('a');
        link.style.display = 'none';
        link.href = esa.presigned_url;
        setTimeout(() => {
          link.click();
        }, 1000 * (index + 1));
      }
    });
  };

  const onSortChange = (sortKey, sortDirection) => {
    setSortKey(sortKey);
    setSortDirection(sortDirection);
  };

  const selectedFiles = Object.keys(selectedArtifacts);
  return (
    <MultiStepModalPane
      key="ExportCSVPane"
      nextBtnName="Export"
      showBackButton
      nextBtnDisabled={selectedFiles.length <= 0}
      onDismiss={() => ModalActions.close(ExportCSVModal.MODAL_ID)}
      beforeNavigateNext={downloadSelectedEsa}
      {...props}
    >
      <div className="tx-stack tx-stack--sm">
        <div className="export-csv-pane__header">
          <TextSubheading className="export-csv-pane__subheading" heavy>Generated data</TextSubheading>
          <Button
            className="export-csv-pane__regenerate-button"
            waitForAction
            type="success"
            height="short"
            size="small"
            onClick={(next) => { regenerateExecutionSupportArtifact(next); }}
          >Regenerate
          </Button>
        </div>
        <div className="export-csv-pane__table" onScroll={onScroll}>
          <Table
            loaded={!initialDataLoading}
            id="esa-csv-export-table"
            data={Immutable.fromJS(esaTableData)}
            emptyMessage="There are no execution support artifacts."
            onSelectRow={(record, willBeSelected, selectedRows) => { setSelectedArtifacts(selectedRows); }}
            onSelectAll={(selectedRows) => { setSelectedArtifacts(selectedRows); }}
            selected={selectedArtifacts}
          >
            <TableColumn renderCellContent={renderCsvName}  header="File name" id="esa-csv-file-name" />
            <TableColumn
              renderCellContent={renderCsvGeneratedOn}
              sortable
              onSortChange={onSortChange}
              header="Generated on"
              id="created_at"
            />
          </Table>
          { dataLoading && <Spinner /> }
        </div>
      </div>
    </MultiStepModalPane>
  );
}

export default ExportCsvPane;
