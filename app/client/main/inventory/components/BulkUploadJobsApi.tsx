import React, { useEffect, useRef, useState } from 'react';
import Immutable from 'immutable';
import _ from 'lodash';

import { Banner, LabeledInput } from '@transcriptic/amino';

import CSVUpload from 'main/inventory/components/CSVUpload';

import './BulkUploadJobsApi.scss';

type UploadFile = {
  status?: string;
  uuid: string;
  file: {
    lastModified: number;
    lastModifiedDate: Date;
    name: string;
    size: number;
    type: string;
    webkitRelativePath: string;
  }
}

type Error = {
  entity: string;
  sourceIdentifier: string;
  description: string;
}

export type JobsApiError = {
  fileName: string,
  errors: Error[]
}

interface Props {
  onCsvChange: (plateFiles, tubeFiles) => void;
  jobsApiErrors: JobsApiError[];
  resetJobsApiErrors: () => void;
}

function BulkUploadJobsApi(props: Props) {
  const {
    onCsvChange,
    jobsApiErrors,
    resetJobsApiErrors
  } = props;

  const [plateFiles, setPlateFiles] = useState(Immutable.Map());
  const [tubeFiles, setTubeFiles] = useState(Immutable.Map());
  const firstMount = useRef(true);
  const hasError = jobsApiErrors && jobsApiErrors.length > 0;

  useEffect(() => {
    if (!firstMount.current) {
      onCsvChange(plateFiles.toList(), tubeFiles.toList());
    } else {
      firstMount.current = false;
    }
  }, [plateFiles, tubeFiles]);

  const removeIdsFromFileMap = (map, fileIds) =>  {
    let newMap = map;
    fileIds.forEach((fileId) => {
      newMap = map.delete(fileId);
    });
    resetJobsApiErrors();
    return newMap;
  };

  // to set the border color of the DragDropFilePicker if there are errors

  useEffect(() => {
    if (hasError) {
      let updatedPlateFiles = plateFiles;
      let updatedTubeFiles = tubeFiles;
      jobsApiErrors.forEach((error) => {
        const fileName = error.fileName;
        const plateEntry = updatedPlateFiles.findEntry((value: UploadFile) => fileName === `plates/${value.file.name}`);
        if (plateEntry) {
          updatedPlateFiles = updatedPlateFiles.updateIn([plateEntry[0]], (plateData) => ({ ...plateData, status: 'fail', file: plateData.file }));
        } else {
          const tubeEntry = updatedTubeFiles.findEntry((value: UploadFile) => fileName === `tubes/${value.file.name}`);
          if (tubeEntry) {
            updatedTubeFiles = updatedTubeFiles.updateIn([tubeEntry[0]], (tubeData) => ({ ...tubeData, status: 'fail', file: tubeData.file }));
          }
        }
      });
      if (updatedPlateFiles) { setPlateFiles(updatedPlateFiles); }
      if (updatedTubeFiles) { setTubeFiles(updatedTubeFiles); }
    }
  }, [jobsApiErrors]);

  return (
    <div className="bulk-upload-jobs-api tx-stack tx-stack--md">
      <h3>Bulk upload CSVs to Job Shipment API</h3>
      {hasError && jobsApiErrors.map((apiError, index) => (
        <Banner
          key={`jobs-api-error-${index.toString()}`}
          bannerType="error"
          bannerTitle={apiError.fileName && `The following errors were found in your file: ${apiError.fileName}`}
          bannerMessage={(
            <ul>
              {apiError.errors.map((error, idx) => (
                <li key={`error-${idx.toString()}`}>{error.description}</li>
              ))}
            </ul>
          )}
        />
      ))
      }
      <div className="bulk-upload-jobs-api__upload">
        <div className="tx-stack tx-stack--sm">
          <LabeledInput label="Plates">
            <CSVUpload
              onCSVChange={(_data, _fileName, fileId, file) => {
                setPlateFiles(plateFiles.set(fileId, file));
              }}
              onFilesDelete={(fileIds) => {
                setPlateFiles(removeIdsFromFileMap(plateFiles, fileIds));
              }}
              size="medium"
            />
          </LabeledInput>
        </div>
        <div className="tx-stack tx-stack--sm">
          <LabeledInput label="Tubes">
            <CSVUpload
              onCSVChange={(_data, _fileName, fileId, file) => {
                setTubeFiles(tubeFiles.set(fileId, file));
              }}
              onFilesDelete={(fileIds) => {
                setTubeFiles(removeIdsFromFileMap(tubeFiles, fileIds));
              }}
              size="medium"
            />
          </LabeledInput>
        </div>
      </div>
    </div>
  );
}

export default BulkUploadJobsApi;
