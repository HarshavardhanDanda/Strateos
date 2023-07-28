import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Immutable from 'immutable';
import JSZip from 'jszip';
import _ from 'lodash';

import { LabeledInput, Select, Banner, DragDropFilePicker } from '@transcriptic/amino';
import ContainerTypeStore from 'main/stores/ContainerTypeStore';
import ContainerStore from 'main/stores/ContainerStore';

import SelectStorage from 'main/components/Input';
import { createWellMap } from 'main/components/PlateCreateFromCSV';
import { parseAndSanitizeCSV } from 'main/inventory/components/CSVUpload';
import uuidv4 from 'uuid/v4';

export default class BulkUploadPlateZip extends Component {
  constructor(props) {
    super(props);
    this.state = {
      plateTypeId: undefined,
      coverStatus: undefined,
      storageCondition: ContainerStore.defaultStorageCondition,
      error: undefined,
      errorFilesLength: 0,
      errorFileIdsMap: {},
      files: Immutable.Map(),
      flattenZipFiles: Immutable.Map(),
      zipFileIdsMap: {}
    };
  }

  processFiles() {
    const { files } = this.state;
    files.forEach((uploadFile, uuid) => {
      if (uploadFile.status === 'success') {
        return;
      }
      const file = uploadFile.file;
      if (file.name.endsWith('.zip')) {
        this.handleZIP(uploadFile);
      } else {
        this.handleCSV(file, '')
          .then(sanitizedData => {
            this.createNewPlate(sanitizedData, file.name, uuid);
            this.updateFileStatus(uuid, 'success');
          })
          .catch(() => {
            this.updateFileStatus(uuid, 'fail');
            this.setState(prevState => ({ errorFilesLength: prevState.errorFilesLength + 1 }), () => this.updateErrorMessage());
          });
      }
    });
  }

  updateErrorMessage() {
    this.setState({ error: `Error occured while parsing ${this.state.errorFilesLength} files` });
  }

  setFilesUUID(newFiles) {
    let filesMap = Immutable.Map();
    newFiles.forEach(file => {
      // we are adding uuid to file, so that we know which file we are aborting
      filesMap = filesMap.set(file.uuid, file);
    });
    return filesMap;
  }

  addNewFilesToState(newFiles, cb) {
    const { files } = this.state;
    this.setState({ files: files.merge(newFiles) }, cb);
  }

  handleFiles(files) {
    const filesMap = this.setFilesUUID(files);
    this.addNewFilesToState(filesMap, () => this.processFiles());
  }

  createNewPlate(sanitizedData, fileName, uuid) {
    const { plateTypeId, storageCondition, coverStatus } = this.state;
    const containerType = ContainerTypeStore.getById(plateTypeId);
    const wellMap = createWellMap(sanitizedData, containerType);
    const plateName = fileName.replace(/\.csv$/i, '');
    this.props.createNewPlate(plateName, plateTypeId, storageCondition, coverStatus, wellMap, uuid);
  }

  handleCSV(file, csvString) {
    return parseAndSanitizeCSV(csvString || file);
  }

  updateFileStatus(uuid, status) {
    const files = Immutable.Map(this.state.files);
    const file = files.get(uuid);
    if (file) {
      const updatedFile = { ...file, status: status, file: file.file };
      const updatedFiles = files.set(uuid, updatedFile);
      this.setState({ files: updatedFiles });
    }
    if (status === 'fail') {
      const obj = {};
      if (obj[uuid]) { obj[uuid] = obj[uuid] + 1; } else {
        obj[uuid] = 1;
      }
      this.setState(({ errorFileIdsMap: Object.assign(obj, this.state.errorFileIdsMap) }));
    }
  }

  updateZipFileStatus(uuid, status) {
    const zipFiles = Immutable.Map(this.state.flattenZipFiles);
    const file = zipFiles.get(uuid);
    if (file) {
      const updatedFile = { ...file, status: status, file: file.file };
      const updatedFiles = zipFiles.set(uuid, updatedFile);
      this.setState({ flattenZipFiles: updatedFiles });
    }
    this.updateZipFileParentStatus(file.zipId);
  }

  updateZipFileParentStatus(parentUuid) {
    const { zipFileIdsMap, flattenZipFiles } = this.state;
    const zipFileIds = zipFileIdsMap[parentUuid];
    let isSuccess = true;
    zipFileIds.forEach(id => {
      const file = flattenZipFiles.get(id);
      if (file.status === 'fail') {
        isSuccess = false;
      }
    });
    this.updateFileStatus(parentUuid, isSuccess ? 'success' : 'fail');
  }

  extractZipFiles(zipFile) {
    return JSZip.loadAsync(zipFile.file).then(unzipped => {
      const zipFiles = [];
      unzipped.forEach((path, file) => {
        if (path.startsWith('__MACOSX')) return;
        const uuid = uuidv4();
        const uploadFile = { path: path, uuid: uuid, zipId: zipFile.uuid, file: file };
        zipFiles.push(uploadFile);
      });
      const newZipFiles = this.setFilesUUID(zipFiles);
      this.setState({ flattenZipFiles: this.state.flattenZipFiles.merge(newZipFiles) });
      const obj = {};
      obj[zipFile.uuid] = newZipFiles.keySeq().toJS();
      this.setState(({ zipFileIdsMap: Object.assign(obj, this.state.zipFileIdsMap) }));
      this.updateFileStatus(zipFile.uuid, 'success');
      return Promise.resolve(newZipFiles);
    }).catch(() => {
      this.updateFileStatus(zipFile.uuid, 'fail');
      this.setState(prevState => ({
        errorFilesLength: prevState.errorFilesLength + 1
      }), () => this.updateErrorMessage());
    });
  }

  processZipFiles(newZipFiles) {
    newZipFiles.forEach((file, uuid) => {
      const uploadFile = file.file;
      uploadFile.async('string').then(csvString => {
        this.handleCSV(uploadFile, csvString)
          .then(sanitizedData => {
            this.createNewPlate(sanitizedData, uploadFile.name, uuid);
            this.updateZipFileStatus(uuid, 'success');
          })
          .catch(() => {
            this.updateZipFileStatus(uuid, 'fail');
            this.setState(prevState => ({
              errorFilesLength: prevState.errorFilesLength + 1
            }), () => this.updateErrorMessage());
          });
      });
    });
  }

  handleZIP(zipFile) {
    this.extractZipFiles(zipFile)
      .then(newZipFiles => this.processZipFiles(newZipFiles));
  }

  abortUpload() {
    const fileIds = [];
    this.state.files.forEach(file => fileIds.push(file.uuid));
    Object.entries(this.state.zipFileIdsMap).map(([, value]) => value.forEach(file => fileIds.push(file)));
    if (this.props.onFilesDelete) {
      this.props.onFilesDelete(fileIds);
    }
    this.setState({ files: Immutable.Map(), error: undefined, zipFileIdsMap: [], errorFilesLength: 0 });
  }

  abortSingleUpload(file) {
    if (file.file.name.endsWith('.zip')) {
      this.props.onFilesDelete(this.state.zipFileIdsMap[file.uuid]);
    } else {
      this.props.onFilesDelete([file.uuid]);
    }
    const files = this.state.files.filter(singleFile => singleFile.uuid !== (file.uuid));
    if (files.size === 0) {
      this.setState({ zipFileIdsMap: [], errorFilesLength: 0 });
    }
    if (this.state.errorFilesLength > 1) { this.setState(prevState => ({ errorFilesLength: prevState.errorFilesLength - this.state.errorFileIdsMap[file.uuid] }), () => this.updateErrorMessage()); } else {
      this.setState({ error: undefined, errorFilesLength: 0 });
    }
    this.setState({ files: files });
  }

  mapToArray() {
    return this.state.files.valueSeq().toJS();
  }

  render() {
    const { plateTypes } = this.props;
    const formFilled = this.state.plateTypeId && this.state.storageCondition;
    const lids = [];
    if (ContainerTypeStore.getById(this.state.plateTypeId)) {
      lids.push(
        ...ContainerTypeStore.getById(this.state.plateTypeId)
          .get('acceptable_lids')
          .concat(['uncovered'])
          .map(lid => ({ value: lid }))
      );
    }

    return (
      <div>
        <div className="tx-stack tx-stack--md">
          {this.state.error ? (<Banner bannerType="error" bannerMessage={this.state.error} />) : ''}
          <h3>Bulk upload your containers</h3>
          <LabeledInput label="Plate Type">
            <Select
              name="plateTypeId"
              placeholder="Select Plate Type"
              value={this.state.plateTypeId}
              options={plateTypes.map(c => ({ value: c.get('id'), name: c.get('name') }))}
              onChange={(e) => this.setState({ plateTypeId: e.target.value, coverStatus: undefined })}
            />
          </LabeledInput>
          <LabeledInput label="Cover Status">
            <Select
              name="coverStatus"
              placeholder="Select Cover Status"
              value={this.state.coverStatus}
              options={lids}
              onChange={(e) => this.setState({ coverStatus: e.target.value })}
            />
          </LabeledInput>
          <LabeledInput label="Storage Condition">
            <SelectStorage
              name="storageCondition"
              value={this.state.storageCondition}
              onChange={(e) => this.setState({ storageCondition: e.target.value })}
            />
          </LabeledInput>
          {(formFilled && (
            <DragDropFilePicker
              onDrop={files => this.handleFiles(files)}
              files={this.mapToArray()}
              abortUpload={() => this.abortUpload()}
              abortSingleUpload={file => this.abortSingleUpload(file)}
              showRetry={false}
              multiple
              size="auto"
              accept=".zip,.csv"
            />
          ))}
          {/* TODO: Consider uploading ZIP to S3 using: <FilePickUpload
            title="Upload ZIP file"
            onAllUploadsDone={}
            accept=".zip"
          /> */}
        </div>
      </div>
    );
  }
}

BulkUploadPlateZip.propTypes = {
  plateTypes: PropTypes.instanceOf(Immutable.Iterable),
  createNewPlate: PropTypes.func,
  onFilesDelete: PropTypes.func
};
