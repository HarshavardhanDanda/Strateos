import React, { useState, useEffect } from 'react';
import moment from 'moment';
import _ from 'lodash';
import {
  Table,
  Column,
  ButtonGroup,
  Button,
  SearchField,
  Select,
  Tooltip
} from '@transcriptic/amino';
import ModalActions from 'main/actions/ModalActions';
import { SinglePaneModal } from 'main/components/Modal';
import InstructionStore from 'main/stores/InstructionStore';
import './DownloadFileModal.scss';

function DownloadFileModal({ runId, run }) {

  if (!run || !run.get('datasets')) return null;

  const [selectedDatasetIds, setSelectedDatasetIds] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [dataType, setDataType] = useState('analysis');

  useEffect(() => {
    _.debounce(setDebouncedSearchQuery, 500)(searchQuery.trim().toLowerCase());
  }, [searchQuery]);

  const datasets = run.get('datasets');
  let data = [];

  const searchDatasets = (dataset) => {
    return _.isNull(dataset.get('title'))
      ? dataset.get('id').includes(debouncedSearchQuery)
      : dataset.get('title').includes(debouncedSearchQuery) || dataset.get('id').includes(debouncedSearchQuery);
  };

  if (dataType.includes('analysis')) {
    const analyses = datasets.filter(dataset => {
      return dataset.get('is_analysis');
    });
    data = analyses.filter(dataset => searchDatasets(dataset));
  } else if (dataType.includes('measurement')) {
    const measurements = datasets.filter(dataset => {
      return !dataset.get('is_analysis');
    });
    data = measurements.filter(dataset => searchDatasets(dataset));
  } else {
    data = datasets.filter(dataset => searchDatasets(dataset));
  }

  const measurementDataRef = (dataset) => {
    const instruction = InstructionStore.getById(dataset.get('instruction_id'));
    return instruction && instruction.getIn(['operation', 'dataref']);
  };

  const renderFileName = (dataset) => {
    return (dataset.get('is_analysis') ?
      <p>{dataset.get('title') || dataset.get('id')}</p>
      :
      <Tooltip  placement="bottom" title={measurementDataRef(dataset)}>{measurementDataRef(dataset)}</Tooltip>);
  };

  const renderDataType = (dataset) => {
    return <p>{dataset.get('is_analysis') ? 'Analysis' : 'Measurement'}</p>;
  };

  const renderId = (dataset) => {
    return <p>{dataset.get('id')}</p>;
  };

  const renderCreatedAt = (dataset) => {
    return <p>{moment(dataset.get('created_at')).format('L')}</p>;
  };

  const resetSelectedDatasetIds = () => {
    setSelectedDatasetIds({});
  };

  const datasetIdsList = Object.keys(selectedDatasetIds);
  const url = `/api/runs/${runId}/zip_data?dataset_ids=` + JSON.stringify(datasetIdsList);

  return (
    <SinglePaneModal
      modalId="DOWNLOAD_FILE_MODAL"
      modalSize="large"
      title="Download Data"
      modalBodyClass="download-file-modal"
    >
      <div className="download-file-content">
        <div className="download-file-content__search">
          <SearchField
            name="search-dataset"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by name or ID"
            reset={() => setSearchQuery('')}
            fullWidth={false}
          />
          <Select
            options={[
              { value: 'analysis', name: 'Analysis' },
              { value: 'measurement', name: 'Measurement' },
              { value: 'all', name: 'All' }
            ]}
            fullWidth={false}
            value={dataType}
            onChange={e => { setDataType(e.target.value); resetSelectedDatasetIds(); }}
          />
        </div>
        <p>All data files related to this run will appear in the table below. </p>
        <Table
          data={data}
          loaded
          toggleRowColor
          id="datasets"
          onSelectRow={(record, willBeSelected, selectedRows) => setSelectedDatasetIds(selectedRows)}
          onSelectAll={selectedRows => setSelectedDatasetIds(selectedRows)}
          selected={selectedDatasetIds}
        >
          <Column renderCellContent={renderFileName} header="File Name" id="title" />
          <Column renderCellContent={renderDataType} header="Type" id="dataType" />
          <Column renderCellContent={renderId} header="ID" id="id" disableFormatHeader />
          <Column renderCellContent={renderCreatedAt} header="Date Created" id="created_at" />
        </Table>
        <ButtonGroup orientation="horizontal">
          <Button
            link
            heavy
            size="small"
            type="secondary"
            onClick={() => {
              resetSelectedDatasetIds();
              ModalActions.close('DOWNLOAD_FILE_MODAL');
            }}
          >
            Cancel
          </Button>
          <Button
            heavy
            size="small"
            type="primary"
            newTab
            tagLink
            to={url}
            disabled={_.isEmpty(selectedDatasetIds)}
          >
            Download
          </Button>
        </ButtonGroup>
      </div>
    </SinglePaneModal>
  );
}

export default DownloadFileModal;
