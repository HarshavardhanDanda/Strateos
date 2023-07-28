import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Immutable from 'immutable';
import moment from 'moment';
import _ from 'lodash';
import {
  Table,
  Column,
  ButtonGroup,
  Button,
  SearchField,
  TextArea,
  LabeledInput,
  Select,
  Tooltip
} from '@transcriptic/amino';
import ModalActions from 'main/actions/ModalActions';
import DatasetActions from 'main/actions/DatasetActions';
import NotificationActions from 'main/actions/NotificationActions';
import Dispatcher from 'main/dispatcher';
import { SinglePaneModal } from 'main/components/Modal';
import RunStore from 'main/stores/RunStore';
import SessionStore from 'main/stores/SessionStore';
import FeatureConstants from '@strateos/features';
import FeatureStore     from 'main/stores/FeatureStore';
import InstructionStore from 'main/stores/InstructionStore';
import './DeleteDataModal.scss';

function DeleteDataModal({ run }) {

  if (!run || !run.get('datasets')) return null;

  const [selectedDatasetId, setSelectedDatasetId] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [dataType, setDataType] = useState('analysis');

  useEffect(() => {
    _.debounce(setDebouncedSearchQuery, 500)(searchQuery.trim().toLowerCase());
  }, [searchQuery]);

  const datasets = run.get('datasets');
  const analyses = datasets.filter(dataset => {
    return dataset.get('is_analysis');
  });

  const measurementDataRef = (dataset) => {
    const instruction = InstructionStore.getById(dataset.get('instruction_id'));
    return instruction && instruction.getIn(['operation', 'dataref']);
  };

  const measurements = datasets.filter(dataset => {
    const isMeasurement = !dataset.get('is_analysis');

    return isMeasurement && measurementDataRef(dataset);
  });

  const measurementsData = measurements.filter(dataset => {
    const dataRef = measurementDataRef(dataset);
    return dataRef.includes(debouncedSearchQuery) || dataset.get('id').includes(debouncedSearchQuery);
  });

  const analysesData = analyses.filter(dataset => {
    return _.isNull(dataset.get('title'))
      ? dataset.get('id').includes(debouncedSearchQuery)
      : dataset.get('title').includes(debouncedSearchQuery) || dataset.get('id').includes(debouncedSearchQuery);
  });

  const labId = run.get('lab_id');
  const isLabManagerOrOperator = FeatureStore.hasFeatureInLab(FeatureConstants.VIEW_RUNS_IN_LABS, labId);

  const drawerChildren = () => {

    const selectedDataset = datasets.find(dataset => dataset.get('id') === selectedDatasetId);

    if (selectedDataset === undefined) return;

    const isAnalysis = selectedDataset.get('is_analysis');
    const isOwner    = _.isEqual(selectedDataset.get('uploaded_by'), SessionStore.getUser('id'));
    let hasPermission = false;
    if (isAnalysis) {
      hasPermission = isLabManagerOrOperator || isOwner;
    } else {
      hasPermission = isLabManagerOrOperator;
    }

    if (dataType === 'analysis' && !hasPermission) {
      return (
        <div className="delete-data-content delete-data-content__grid">
          <p>You are not authorized to delete {selectedDataset.get('title') || selectedDataset.get('id')}.</p>
          <div className="delete-data-content__button">
            <Button
              heavy
              size="medium"
              type="primary"
              onClick={() => setShowConfirmation(false)}
            >
              Ok
            </Button>
          </div>
        </div>
      );
    }

    const analysisReasonsforDeletion = [
      { name: 'Attached data is incorrect', value: 'incorrect' },
      { name: 'Analysis is outdated', value: 'outdated' },
      { name: 'Dataset is no longer needed', value: 'unnecessary' },
      { name: 'Other', value: 'other' },
    ];

    const measurementReasonsforDeletion = [
      { name: 'Wrong dataset was uploaded to an instruction', value: 'wrong_dataset' },
      { name: 'Incomplete dataset was uploaded', value: 'incomplete' },
      { name: 'Dataset had a wrong format', value: 'incorrect_format' },
      { name: 'Dataset required manual review and correction', value: 'required_correction' },
      { name: 'Other', value: 'other' },
    ];

    return (
      <div className="delete-data-content delete-data-content__grid">
        <p>Please confirm by selecting a reason to delete file {selectedDataset.get('title') || selectedDataset.get('id')}?</p>
        <div className="delete-data-content__input">
          <LabeledInput label="Reason for deletion" disableFormatLabel>
            <Select
              name="reason"
              value={reason}
              placeholder="Provide your comment here"
              onChange={e => setReason(e.target.value)}
              options={dataType === 'analysis' ? analysisReasonsforDeletion : measurementReasonsforDeletion}
            />
          </LabeledInput>
        </div>
        <div className="delete-data-content__input">
          {reason === 'other' && (
            <LabeledInput label="Please specify" disableFormatLabel>
              <TextArea
                name="note"
                value={note}
                placeholder="Type your comment here"
                onChange={e => setNote(e.target.value)}
              />
            </LabeledInput>
          )}
        </div>
        <div className="delete-data-content__button">
          <ButtonGroup orientation="horizontal">
            <Button
              link
              heavy
              size="small"
              type="secondary"
              onClick={() => setShowConfirmation(false)}
            >
              Cancel
            </Button>
            <Button
              heavy
              size="small"
              type="danger"
              onClick={deleteDataset}
            >
              Delete
            </Button>
          </ButtonGroup>
        </div>
      </div>
    );
  };

  const renderFileName = (dataset) => {
    return <p>{dataset.get('title') || dataset.get('id')}</p>;
  };

  const renderDataRefName = (dataset) => {
    return <Tooltip  placement="bottom" title={measurementDataRef(dataset)}>{measurementDataRef(dataset)}</Tooltip>;
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

  const getInstructionName = (instruction) => {
    return _.capitalize(instruction.get('op').split('_').join(' '));
  };

  const renderInstructionName = (dataset) => {
    const instruction = InstructionStore.getById(dataset.get('instruction_id'));
    const instruction_name = getInstructionName(instruction);
    return <p>{instruction_name}</p>;
  };

  const renderInstructionId = (dataset) => {
    return <p>{dataset.get('instruction_id')}</p>;
  };

  const updateRun = (dataset, run) => {
    const updatedRun = run.set('datasets',
      run.get('datasets').filter(
        item => item.get('id') !== dataset.id
      )
    );
    Dispatcher.dispatch({
      type: 'RUN_DATA',
      run: updatedRun.toJS()
    });
  };

  const deleteDataset = async () => {
    const dataset = reason === 'other' ? await DatasetActions.destroy(selectedDatasetId, run.get('id'), note) : await DatasetActions.destroy(selectedDatasetId, run.get('id'), reason);
    if (dataType === 'analysis') {
      const run = RunStore.getById(dataset.run_id);
      updateRun(dataset, run);
    } else {
      const instruction_id = dataset.instruction_id;
      const instruction = InstructionStore.getById(instruction_id);
      const run = RunStore.getById(instruction.get('run_id'));
      updateRun(dataset, run);
    }
    NotificationActions.createNotification({
      isSuccess: true,
      text: 'Successfully removed dataset'
    });
    setSelectedDatasetId('');
    setShowConfirmation(false);
    setNote('');
    setReason('');
    ModalActions.close('DELETE_FILE_MODAL');
  };

  const renderMeasurementTableColumns = () => {
    return [
      <Column renderCellContent={renderDataRefName} header="Name" id="title" key="title" />,
      <Column renderCellContent={renderInstructionName} header="Instruction Name" id="instruction_name" key="instruction-name" />,
      <Column renderCellContent={renderId} header="Dataset ID" id="dataset_id" key="dataset-id" />,
      <Column renderCellContent={renderInstructionId} header="Instruction ID" id="instruction_id"key="instruction-id" />,
      <Column renderCellContent={renderDataType} header="Type" id="dataType" key="data-type" />,
      <Column renderCellContent={renderCreatedAt} header="Date Created" id="created_at" key="created-at" />
    ];
  };

  const renderAnalysisTableColumns = () => {
    return [
      <Column renderCellContent={renderFileName} header="File Name" id="title" key="title" />,
      <Column renderCellContent={renderDataType} header="Type" id="dataType" key="data-type" />,
      <Column renderCellContent={renderId} header="ID" id="id" disableFormatHeader key="id" />,
      <Column renderCellContent={renderCreatedAt} header="Date Created" id="created_at" key="created-at" />
    ];
  };

  const options = [
    { value: 'analysis', name: 'Analysis' },
    { value: 'measurement', name: 'Measurement' }
  ];

  const renderOption = (option) => {
    if (option.value == 'measurement') { return isLabManagerOrOperator; }
    return true;
  };

  return (
    <SinglePaneModal
      modalId="DELETE_FILE_MODAL"
      modalSize="xlg"
      title="Delete Files"
      modalBodyClass="delete-data-modal"
      hasDrawer
      drawerState={showConfirmation}
      drawerTitle="Delete file"
      onDrawerClose={() => setShowConfirmation(false)}
      drawerChildren={drawerChildren()}
      onDismissed={() => {
        setSelectedDatasetId('');
        setSearchQuery('');
        setNote('');
        setReason('');
        ModalActions.close('DELETE_FILE_MODAL');
      }}
    >
      <div className="delete-data-content delete-data-content__grid">
        <div className="delete-data-content__search">
          <SearchField
            name="search-dataset"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by name or ID"
            reset={() => setSearchQuery('')}
            fullWidth
          />
          <Select
            options={options.filter(option => renderOption(option))}
            fullWidth={false}
            value={dataType}
            onChange={e => setDataType(e.target.value)}
          />
        </div>
        <p>Your data files will appear in the table below. </p>
        <Table
          data={dataType === 'analysis' ? analysesData : measurementsData}
          loaded
          toggleRowColor
          id="datasets"
          onSelectRow={(record, willBeSelected, selectedRows) => {
            const allSelections = Object.keys(selectedRows);
            const mostRecentSelection = allSelections.pop();
            setSelectedDatasetId(mostRecentSelection);
          }}
          onSelectAll={_ => setSelectedDatasetId(selectedDatasetId)}
          selected={{ [selectedDatasetId]: true }}
        >
          {dataType === 'analysis' ? renderAnalysisTableColumns() : renderMeasurementTableColumns()}
        </Table>
        <ButtonGroup orientation="horizontal">
          <Button
            link
            heavy
            size="small"
            type="secondary"
            onClick={() => {
              setSelectedDatasetId('');
              setSearchQuery('');
              setNote('');
              setReason('');
              ModalActions.close('DELETE_FILE_MODAL');
            }}
          >
            Cancel
          </Button>
          <Button
            heavy
            size="small"
            type="danger"
            onClick={() => setShowConfirmation(true)}
            disabled={selectedDatasetId === ''}
          >
            Delete
          </Button>
        </ButtonGroup>
      </div>
    </SinglePaneModal>
  );
}

DeleteDataModal.propTypes = {
  run: PropTypes.instanceOf(Immutable.Map).isRequired
};

export default DeleteDataModal;
