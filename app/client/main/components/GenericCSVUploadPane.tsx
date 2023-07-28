import React, { useState } from 'react';
import CSVUtil from 'main/util/CSVUtil';
import { parseAndSanitizeCSV } from 'main/inventory/components/CSVUpload';
import { DragDropFilePicker, Button } from '@transcriptic/amino';

import './GenericCSVUploadPane.scss';

const EMPTY_FILE_MSG = 'Empty CSV file, please check your CSV file and retry.';
const CSV_FORMAT_ERR_MSG = 'CSV Format error, please check your file and retry.';

type CsvFile = { uuid: string, status?: string, file: File };
type CsvData = { [key: string]: string }[];

export interface Props {
  template: {}[];
  setCSVData: (containers) => void;
  handleError: (hasError) => void;
  handleBannerMsg?: (bannerType, bannerMsg) => void;
  showRetry?: boolean;
  handleReset?: () => void;
  validateCsvData?: (data: CsvData, csv: CsvFile) => { isError: boolean; errorMessage?: string; };
}

function GenericCSVUploadPane(props: Props) {
  const [uploadStatus, setUploadStatus] = useState('none');
  const [files, setFiles] = useState<CsvFile[]>([]);

  const handleCsv = (csv) => {
    return parseAndSanitizeCSV(csv.file)
      .then((data: CsvData) => {
        try {
          if (!data.length) {
            throw new Error(EMPTY_FILE_MSG);
          }

          if (props.validateCsvData) {
            const { isError, errorMessage } = props.validateCsvData(data, csv.file);
            if (isError) {
              throw new Error(errorMessage || CSV_FORMAT_ERR_MSG);
            }
          }
          handleSuccess(csv, data);
        } catch (error) {
          const errorMsg = error.toString().substring(error.toString().indexOf(':') + 2);
          handleFailure(csv, errorMsg);
        }
      })
      .catch(() => {
        handleFailure(csv, CSV_FORMAT_ERR_MSG);
      });
  };

  const onDrop = async (files) => {
    if (uploadStatus === 'none') {
      setUploadStatus('uploading');
      setFiles(files);
    }
  };

  const handleSuccess = (file: CsvFile, data: CsvData) => {
    if (props.setCSVData) {
      props.setCSVData(data);
    }
    const updatedFile = { ...file, status: 'success', file: file.file };
    setFiles([updatedFile]);
    setUploadStatus('success');
    props.handleError(false);
  };

  const handleFailure = (file: CsvFile, errorMessage?: string) => {
    if (props.handleBannerMsg && errorMessage) {
      props.handleBannerMsg('error', errorMessage);
    }
    const updatedFile = { ...file, status: 'fail', file: file.file };
    setFiles([updatedFile]);
    setUploadStatus('fail');
    props.handleError(true);
  };

  const onRetryAndAbort = () => {
    setUploadStatus('none');
    setFiles([]);
    props.handleError(false);
    if (props.handleReset) {
      props.handleReset();
    }
  };

  return (
    <div className="csv-upload-pane__body">
      <div className="csv-upload-pane__dragdrop-buttons">
        <Button
          type="secondary"
          onClick={() => CSVUtil.downloadCSVFromJSON(props.template, 'containers')}
          height="short"
          icon="far fa-download"
        >
          Download template
        </Button>
      </div>
      <div className="csv-upload-pane__dragdrop">
        <DragDropFilePicker
          onDrop={(files) => onDrop(files).then(() => handleCsv(files[0]))}
          files={files}
          accept=".csv"
          {...props.showRetry && { retryUpload: () => onRetryAndAbort() }}
          abortSingleUpload={() => onRetryAndAbort()}
          multiple={false}
          size="auto"
        />
      </div>
    </div>
  );
}

export default GenericCSVUploadPane;
