import React from 'react';
import PropTypes  from 'prop-types';
import _ from 'lodash';

import CSVUtil from 'main/util/CSVUtil';
import Immutable from 'immutable';
import { parseAndSanitizeCSV } from 'main/inventory/components/CSVUpload';
import { DragDropFilePicker, Banner } from '@transcriptic/amino';

import './CsvUploadPane.scss';

const bannerMessage = 'You can download the CSV template by clicking on the link below ( csv files accepted )';

const emptyFileMessage = 'Empty CSV file, please check your CSV file and retry.';
const invalidCountMessage = 'Some of the vials are exceeding the expected count, please check your CSV file and retry.';
const invalidContainerMessage = 'Vials should only be of type A1, D1 or D2, please check your CSV file and retry.';
const incorrectFormatMsg = 'Mandatory headers missing in CSV file. Expected, format and barcode as headers';
const csvFormatErrorMsg = 'CSV Format error, please check your CSV file and retry.';
const expectedVialTypes = Immutable.List(['a1-vial', 'd1-vial', 'd2-vial']);
const errorMsgs = Immutable.List([emptyFileMessage, invalidCountMessage, invalidContainerMessage, incorrectFormatMsg]);

class CsvUploadPane extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      uploadStatus: 'none',
      containers: [],
      files: [],
      waitingOnResponse: false,
      loadFailure: false,
      bannerMessage: bannerMessage,
      bannerType: 'info',
      showBanner: true
    };
  }

  onDrop(files) {
    if (this.state.uploadStatus === 'none') {
      this.setState({ files: files, uploadStatus: 'uploading' }, () => {
        const [file] = this.state.files;
        const uploadFile = file.file;
        if (uploadFile.name.includes('.csv')) {
          this.handleCsv(file);
        } else {
          this.handleFailure(file);
        }
      });
    }
  }

  handleSuccess(file) {
    const updatedFile = { ...file, status: 'success', file: file.file };
    this.setState({ uploadStatus: 'success', files: [updatedFile] });
  }

  handleFailure(file) {
    const updatedFile = { ...file, status: 'fail', file: file.file };
    this.setState({ uploadStatus: 'fail', files: [updatedFile] });
  }

  showBannerError(msg) {
    this.setState({
      bannerType: 'error',
      waitingOnResponse: false,
      bannerMessage: msg
    });
  }

  handleCsv(csv) {
    return parseAndSanitizeCSV(csv.file).then((data) => {
      if (!data.length) {
        this.showBannerError(emptyFileMessage);
        throw new Error(emptyFileMessage);
      }
      const containers = [];
      data.forEach((row) => {
        if (row.format === undefined) {
          this.showBannerError(incorrectFormatMsg);
          throw new Error(incorrectFormatMsg);
        }
        if (row.barcode === undefined) {
          this.showBannerError(incorrectFormatMsg);
          throw new Error(incorrectFormatMsg);
        }
        if (row.barcode !== '') {
          containers.push({
            container_type_id: row.format,
            barcode: row.barcode
          });
        }
      });
      if (!this.isValidContainer(containers)) {
        this.showBannerError(invalidContainerMessage);
        throw new Error(invalidContainerMessage);
      }
      if (!this.isValidCount(containers)) {
        this.showBannerError(invalidCountMessage);
        throw new Error(invalidCountMessage);
      }
      this.setContainers(containers);
      return containers;
    }).then((containers) => {
      this.handleSuccess(csv);
      const sortedContainers = this.sortContainers(containers);
      this.props.handleBarcodeUpdate(sortedContainers);
    }).catch((e) => {
      const errorMsg = e.toString().substring(e.toString().indexOf(':') + 2);
      if (!errorMsgs.includes(errorMsg)) {
        this.showBannerError(csvFormatErrorMsg);
      }
      this.handleFailure(csv);
    });
  }

  getAllContainers(containers) {
    return [...containers, ...this.props.items];
  }

  isValidContainer(data) {
    const containerTypes = data.map((container) => { return container.container_type_id; });
    for (const  containerType of containerTypes) {
      if (!expectedVialTypes.includes(containerType)) {
        return false;
      }
    }
    return true;
  }

  isValidCount(data) {
    const containerTypeCount = this.getUploadedContainerTypeCount(data);
    const expectedContainerTypeCount = this.getAvailableContainerTypeCount(this.props.items);
    for (const vial of expectedVialTypes) {
      if (!this.isLessThanMaxContainers(containerTypeCount, expectedContainerTypeCount, vial)) {
        return false;
      }
    }
    return true;
  }

  isLessThanMaxContainers(containerTypeCount, expectedContainerTypeCount, type) {
    return (containerTypeCount[type] <= expectedContainerTypeCount[type]);
  }

  getUploadedContainerTypeCount(data) {
    const countTypes = { 'a1-vial': 0, 'd1-vial': 0, 'd2-vial': 0 };
    data.map((container) => countTypes[container.container_type_id] +=  1);
    return countTypes;
  }

  getAvailableContainerTypeCount(data) {
    const countTypes = { 'a1-vial': 0, 'd1-vial': 0, 'd2-vial': 0 };
    data.map((container) => !container.isValid && (countTypes[container.container_type_id] +=  1));
    return countTypes;
  }

  sortContainers(containers) {
    return _.sortBy(containers, [container => container.container_type_id]);
  }

  setContainers(containers) {
    this.setState({
      containers,
      bannerType: 'info',
      bannerMessage: bannerMessage
    });
  }

  onRetryAndAbort() {
    this.setState({ uploadStatus: 'none', files: [], bannerMessage, bannerType: 'info' });
  }

  getCsvTemplate() {
    const containers = [];
    this.props.items.forEach((item) => {
      containers.push({
        format: item.container_type_id,
        barcode: item.isValid ? item.barcode : null
      });
    });
    return containers;
  }

  render() {
    return (
      <div classNames={{ 'csv-upload-pane__body': true }}>
        <div className="csv-upload-pane__banner">
          {this.state.showBanner && (
            <Banner
              bannerType={this.state.bannerType}
              bannerMessage={this.state.bannerMessage}
              onClose={() => { this.setState({ showBanner: false }); }}
            />
          )}
        </div>
        <div className="csv-upload-pane__dragdrop">
          <div className="tx-inline">
            <a
              className="tx-inline__item--xxs  bulk-upload-link"
              onClick={() =>  CSVUtil.downloadCSVFromJSON(this.getCsvTemplate(), 'containers')}
            >
              <i className="csv-upload-pane__download-icon fa fa-cloud-upload-alt" />
              Download the expected csv format
            </a>
          </div>
          <DragDropFilePicker
            onDrop={(files) => {
              this.onDrop(files);
            }}
            files={this.state.files}
            accept=".csv"
            uploadStatus={this.state.uploadStatus}
            retryUpload={() => this.onRetryAndAbort()}
            abortUpload={() => this.onRetryAndAbort()}
            multiple={false}
            size="auto"
          />
        </div>

      </div>
    );
  }
}

CsvUploadPane.propTypes = {
  items: PropTypes.array.isRequired,
  handleBarcodeUpdate: PropTypes.func.isRequired
};

export default CsvUploadPane;
