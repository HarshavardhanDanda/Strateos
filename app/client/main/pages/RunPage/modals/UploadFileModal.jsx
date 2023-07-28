import Immutable from 'immutable';
import React, { useState, useEffect } from 'react';
import _ from 'lodash';
import {
  PizzaTracker,
  DragDropFilePicker,
  Button,
  ButtonGroup,
  RadioGroup,
  Radio,
  LabeledInput,
  TextInput,
  SearchField,
  Table,
  Column,
  TagInput,
  TextArea,
} from '@transcriptic/amino';

import DatasetAPI from 'main/api/DatasetAPI';
import NotificationActions from 'main/actions/NotificationActions';
import ModalActions from 'main/actions/ModalActions';
import RunActions from 'main/actions/RunActions';

import * as Uploader from 'main/util/uploader';
import assembleFullJSON from 'main/helpers/RunPage/assembleFullJSON';
import { runIsFullJSON } from 'main/helpers/RunPage/loadStatus';
import orderedInstructionsWithRefNames from 'main/helpers/RunPage/orderedInstructionsWithRefNames';
import Dispatcher from 'main/dispatcher';

import { SinglePaneModal } from 'main/components/Modal';
import ContainerTags from 'main/components/InstructionCard/ContainerTags';

import InstructionStore from 'main/stores/InstructionStore';
import RefStore from 'main/stores/RefStore';
import FeatureStore from 'main/stores/FeatureStore';
import FeatureConstants from '@strateos/features';

import './UploadFileModal.scss';

function UploadFileModal({ run, runId }) {
  if (!run || !run.get('datasets')) return null;
  const labId = run.get('lab_id');
  const isLabManagerOrOperator = FeatureStore.hasFeatureInLab(FeatureConstants.VIEW_RUNS_IN_LABS, labId);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [files, setFiles] = useState([]);
  const [uploadPercent, setUploadPercent] = useState(0);
  const [config, setConfig] = useState({
    dataType: 'analysis',
    tool: '',
    toolVersion: '',
    instructionId: '',
    instructionNames: []
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [showInstructions, setShowInstructions] = useState(false);
  const [instructionIdToRender, setInstructionIdToRender] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    _.debounce(setDebouncedSearchQuery, 500)(searchQuery.trim().toLowerCase());
  }, [searchQuery]);

  const instructionToDatasets = run.get('datasets').reduce((result, dataset) => {
    return result.set(dataset.get('instruction_id'), dataset);
  }, Immutable.Map());
  const refs = RefStore.getByRunId(runId).toList();
  const instructions = orderedInstructionsWithRefNames(InstructionStore.getByRunId(runId), refs)
    .filter(instruction => {
      const dataref = instruction.getIn(['operation', 'dataref']);
      const dataset = instructionToDatasets.get((instruction.get('id')));
      return !_.isUndefined(dataref) && _.isUndefined(dataset);
    });
  const data = instructions.filter(instruction => {
    return instruction.get('op').includes(debouncedSearchQuery) || instruction.get('id').includes(debouncedSearchQuery);
  });
  let fullJSON;
  if (runIsFullJSON(run)) {
    fullJSON = run;
  } else {
    fullJSON = assembleFullJSON({ run: run, instructions, refs });
  }

  const onDropFiles = (newFiles) => {
    const newListOfFiles = config.dataType === 'analysis' ? newFiles.concat(files) : newFiles;
    uploadFiles(newListOfFiles);
  };

  const uploadFiles = async (files) => {
    setUploadPercent(0);
    const toUploadFiles = files.filter(file => file.status !== 'success').length;
    const allFiles = _.cloneDeep(files);
    allFiles.forEach(file => {
      if (file.status !== 'success') {

        file.status = 'uploading';
        setFiles(allFiles);
        const uploadFile = file.file;

        const uploader = Uploader.uploadFile(uploadFile, uploadFile.name);
        uploader.progress(data => setUploadPercent(currentPercentage => currentPercentage + data.percentDone / toUploadFiles));
        uploader
          .done(data => {
            file.upload_id = data.id;
            file.status = 'success';
            setFiles([]);
            setFiles(allFiles);
          })
          .fail(() => file.status = 'fail');
      }
    });
  };

  const onSave = async () => {
    if (config.dataType === 'analysis') {
      files.forEach(async (file) => {
        const name = file.file.name;
        const upload_id = file.upload_id;
        const data = {
          type: 'datasets',
          title: name,
          run_id: runId,
          analysis_tool: config.tool,
          analysis_tool_version: config.toolVersion,
          upload_id,
          comment: note
        };
        await DatasetAPI.createDataset(data);
      });

    } else {
      const { name, size } = files[0].file;
      const upload_id = files[0].upload_id;
      const data = {
        data: {
          name,
          size,
          upload_id,
          comment: note
        }
      };
      const instruction = await RunActions.attachInstructionData(config.instructionId, data);
      const updatedRun = run.setIn(['instructions', instruction.sequence_no], Immutable.fromJS(instruction));
      const originalDatasets = run.get('datasets').filter(d => d.get('instruction_id') !== instruction.id);
      const updatedDatasets = originalDatasets.push(Immutable.fromJS(instruction.dataset));
      const result = updatedRun.set('datasets', updatedDatasets);
      Dispatcher.dispatch({
        type: 'RUN_DATA',
        run: result.toJS()
      });
    }
    NotificationActions.createNotification({
      isSuccess: true,
      text: 'Successfully uploaded dataset'
    });
    // will call an api to add upload note;
    ModalActions.close('UPLOAD_FILE_MODAL');
    onCloseUploadModal();
  };

  const abortSingleUpload = (file) => {
    setFiles(files =>
      files.filter(singleFile => singleFile.upload_id !== file.upload_id)
    );
  };

  const onCloseUploadModal = () => {
    setActiveStepIndex(0);
    setFiles([]);
    setUploadPercent(0);
    setConfig({
      dataType: 'analysis',
      tool: '',
      toolVersion: '',
      instructionId: '',
      instructionName: []
    });
    setNote('');
    setInstructionIdToRender('');
    setSearchQuery('');
    ModalActions.close('UPLOAD_FILE_MODAL');
  };

  const onRemoveTag = () => {
    setConfig({
      ...config,
      instructionId: '',
      instructionNames: []
    });
    setSearchQuery('');
    setInstructionIdToRender('');
  };

  const onCloseDrawer = () => {
    setShowInstructions(false);
    setInstructionIdToRender('');
    setSearchQuery('');
  };

  const renderConfigs = () => {
    if (!config) return;

    if (config.dataType === 'analysis') {
      return (
        <div className="upload-file-modal__config">
          <LabeledInput label="Analysis tool" disableFormatLabel icon="info">
            <TextInput
              value={config.tool}
              fullWidth
              onChange={e => setConfig({
                ...config,
                tool: e.target.value
              })}
            />
          </LabeledInput>
          <LabeledInput label="Tool version" disableFormatLabel icon="info">
            <TextInput
              value={config.toolVersion}
              fullWidth
              onChange={e => setConfig({
                ...config,
                toolVersion: e.target.value
              })}
            />
          </LabeledInput>
        </div>
      );
    } else if (config.dataType === 'measurement' && _.isEmpty(config.instructionNames)) {
      return (
        <div className="upload-file-modal__button-container">
          <Button
            link
            heavy
            size="small"
            type="primary"
            onClick={() => setShowInstructions(true)}
          >
            Select instruction
          </Button>
        </div>
      );
    } else {
      return (
        <TagInput>
          {config.instructionNames.map(name => {
            return (
              <TagInput.Tag
                key={name}
                text={name}
                onRemove={onRemoveTag}
              />
            );
          })}
        </TagInput>
      );
    }
  };

  const radioButtons = [
    <Radio
      id="analysis"
      name="analysis"
      value="analysis"
      label="Analysis"
      key="analysis"
    />,
    <Radio
      id="measurement"
      name="measurement"
      value="measurement"
      label="Measurement"
      key="measurement"
    />
  ];

  const shouldRender = (button) => {
    if (button.props.id === 'measurement') {
      return isLabManagerOrOperator;
    }
    return true;
  };

  const steps = [
    {
      title: 'Configure',
      iconClass: 'far fa-cog',
      content: (
        <div className="upload-file-modal__content">
          <LabeledInput label="Data type" disableFormatLabel>
            <RadioGroup
              name="dataType"
              value={config.dataType}
              onChange={e => setConfig({
                ...config,
                dataType: e.target.value,
              })}
            >
              {radioButtons.filter(button => shouldRender(button))}
            </RadioGroup>
          </LabeledInput>
          {renderConfigs()}
          <LabeledInput label="Note" disableFormatLabel>
            <TextArea
              placeholder="Input text"
              value={note}
              onChange={e => setNote(e.target.value)}
            />
          </LabeledInput>
          <div className="upload-file-modal__button-group">
            <ButtonGroup orientation="horizontal">
              <Button
                link
                heavy
                size="small"
                type="secondary"
                onClick={onCloseUploadModal}
              >Cancel
              </Button>
              <Button
                heavy
                size="small"
                type="primary"
                onClick={() => setActiveStepIndex(1)}
              >Next
              </Button>
            </ButtonGroup>
          </div>
        </div>
      )
    },
    {
      title: 'Upload file',
      iconClass: 'far fa-file-check',
      content: (
        <div className="upload-file-modal__content">
          <DragDropFilePicker
            onDrop={newFiles => onDropFiles(newFiles)}
            uploadPercent={() => uploadPercent}
            files={files}
            multiple={config.dataType === 'analysis'}
            size="auto"
            abortUpload={() => { setFiles([]); setUploadPercent(0); }}
            abortSingleUpload={file => abortSingleUpload(file)}
          />
          <div className="upload-file-modal__button-group">
            <Button
              link
              heavy
              size="small"
              type="secondary"
              onClick={onCloseUploadModal}
            >Cancel
            </Button>
            <Button
              heavy
              size="small"
              type="secondary"
              onClick={() => { setFiles([]); setUploadPercent(0); setActiveStepIndex(0); }}
            >Back
            </Button>
            <Button
              heavy
              size="small"
              type="primary"
              label={config.dataType === 'measurement' && 'Please select an instruction'}
              disabled={(config.dataType === 'measurement' && _.isEmpty(config.instructionId)) ||
                  !(files.length && _.every(files, ['status', 'success']))}
              onClick={onSave}
            >Save
            </Button>
          </div>
        </div>
      )
    },
  ];

  const getInstructionName = (instruction) => {
    return _.capitalize(instruction.get('op').split('_').join(' '));
  };

  const renderInstructionName = (instruction) => {
    const name = getInstructionName(instruction);
    return (
      <p>{name}</p>
    );
  };

  const renderInstructionDataLabel = (instruction) => {
    return (
      <p className="upload-file-modal__data-label">{instruction.getIn(['operation', 'dataref'])}</p>
    );
  };

  const renderContainerRefs = (instruction) => {
    return (
      <ContainerTags instruction={instruction} run={fullJSON} className="upload-file-modal__container-tags" />
    );
  };

  const renderDrawerChildren = () => {
    return (
      <div className="upload-file-modal__drawer">
        <SearchField
          name="search-instruction"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search by name or ID"
          reset={() => setSearchQuery('')}
        />
        <Table
          data={data}
          loaded
          toggleRowColor
          id="instructions"
          onSelectRow={(record, willBeSelected, selectedRows) => {
            const allSelections = Object.keys(selectedRows);
            const mostRecentSelection = allSelections.pop();
            setInstructionIdToRender(mostRecentSelection);
          }}
          onSelectAll={() => {}}
          // To display current checked option in the modal;
          // If a user does not confirm the choice, it does not
          // change config.instructionId; therefore, these two ids
          // represent different values.
          selected={{ [instructionIdToRender]: true }}
        >
          <Column renderCellContent={renderInstructionName} header="Instruction name" id="instruction_name" />
          <Column renderCellContent={renderInstructionDataLabel} header="Instruction ID" id="instruction_id" />
          <Column renderCellContent={renderContainerRefs} header="Container refs" id="container_refs" relativeWidth={2} />
        </Table>
        <div className="upload-file-modal__button-group">
          <ButtonGroup orientation="horizontal">
            <Button
              link
              heavy
              size="small"
              height="short"
              type="secondary"
              onClick={onCloseDrawer}
            >Cancel
            </Button>
            <Button
              heavy
              size="small"
              height="short"
              type="primary"
              onClick={() => {
                if (!_.isEmpty(instructionIdToRender)) {
                  const selectedInstruction = data.find(instruction => instruction.get('id') === instructionIdToRender);
                  const instructionNames = [getInstructionName(selectedInstruction)];
                  setConfig({
                    ...config,
                    instructionId: instructionIdToRender,
                    instructionNames
                  });
                }
                setShowInstructions(false);
              }}
            >Confirm
            </Button>
          </ButtonGroup>
        </div>
      </div>
    );
  };

  return (
    <SinglePaneModal
      modalId="UPLOAD_FILE_MODAL"
      modalSize="xlg"
      title="Upload Data"
      modalBodyClass="upload-file-modal"
      hasDrawer
      drawerState={showInstructions}
      drawerTitle="Select instruction"
      onDrawerClose={() => setShowInstructions(false)}
      drawerChildren={renderDrawerChildren()}
      onDismissed={onCloseUploadModal}
    >
      <div className="upload-file-modal__content">
        <PizzaTracker
          steps={steps}
          activeStepIndex={activeStepIndex}
          onChange={index => setActiveStepIndex(index)}
        />
      </div>
    </SinglePaneModal>
  );
}

export default UploadFileModal;
