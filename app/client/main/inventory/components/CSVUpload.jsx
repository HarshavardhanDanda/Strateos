import _          from 'lodash';
import Papa       from 'papaparse';
import PropTypes  from 'prop-types';
import React      from 'react';
import { DragDropFilePicker } from '@transcriptic/amino';
import Immutable from 'immutable';

import './CSVUpload.scss';

// CSVs uploaded with empty rows (common with OSX Numbers app for instance) will
// have data objects that have the empty string for all keys. This filters those
// out.
function filterEmptyData(dataObjects) {
  const everyKeyIsEmpty = dataObject =>
    _.every(_.values(dataObject), value => value.trim() === '');
  return _.reject(dataObjects, everyKeyIsEmpty);
}

// Trailing commas will create a key with the empty string in the data objects.
// This removes that extraneous key
function removeEmptyStringKey(dataObjects) {
  return dataObjects.map(dataObject => _.omit(dataObject, ''));
}

function trimWhitespace(dataObjects) {
  return dataObjects.map(dataObject =>
    _.mapValues(dataObject, value => value.trim())
  );
}

function sanitizeData(dataObjects) {
  return _.flowRight(
    trimWhitespace,
    removeEmptyStringKey,
    filterEmptyData
  )(dataObjects);
}

function parseAndSanitizeCSV(csvStringOrFile) {
  return new Promise((resolve, reject) => {
    Papa.parse(csvStringOrFile, {
      header: true,
      skipEmptyLines: true,
      error: () => reject([]),
      complete: ({ data, errors }) => {
        if (errors.length > 0 || data.length === 0) {
          reject(errors);
        } else {
          const sanitized = sanitizeData(data);
          resolve(sanitized);
        }
      }
    });
  });
}

class CSVUpload extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.onUpload = this.onUpload.bind(this);
    this.handle = this.handle.bind(this);
    this.updateFileStatus = this.updateFileStatus.bind(this);

    this.state = {
      files: Immutable.Map()
    };
  }

  abortUpload() {
    this.props.onFilesDelete(this.state.files.keySeq());
    this.setState({ files: Immutable.Map() });
  }

  abortSingleUpload(file) {
    this.props.onFilesDelete([file.uuid]);
    const files = this.state.files.filter(singleFile => singleFile.uuid !== file.uuid);
    this.setState({ files });
  }

  setFilesUUID(newFiles) {
    let filesMap = Immutable.Map();
    newFiles.forEach(file => {
      filesMap = filesMap.set(file.uuid, file);
    });
    return filesMap;
  }

  addNewFilesToState(newFiles, cb) {
    const { files } = this.state;
    this.setState({ files: files.merge(newFiles) }, cb);
  }

  onUpload(files) {
    const filesMap = this.setFilesUUID(files);
    this.addNewFilesToState(filesMap, () => this.processFiles());
  }

  processFiles() {
    const { files } = this.state;
    let error;
    files.map(file => {
      if (file.status === 'success') {
        return;
      }
      const uploadFile = file.file;
      this.handle(uploadFile)
        .then((sanitizedData) => {
          if (this.props.onCSVChange) {
            error = this.props.onCSVChange(sanitizedData, uploadFile.name, file.uuid, file);
          }
          if (!error) { this.updateFileStatus(file.uuid, 'success'); } else {
            this.updateFileStatus(file.uuid, 'fail');
          }
        })
        .catch(() => {
          this.updateFileStatus(file.uuid, 'fail');
        });
      return file;
    });
  }

  updateFileStatus(uuid, status) {
    let files = Immutable.Map(this.state.files);
    const file = files.get(uuid);
    const updatedFile = { ...file, status: status, file: file.file };
    files = files.set(uuid, updatedFile);
    this.setState({ files });
  }

  handle(file) {
    if (file) {
      return parseAndSanitizeCSV(file);
    }
    return Promise.reject();
  }

  mapToArray() {
    return this.state.files.valueSeq().toJS();
  }

  render() {
    return (
      <div className="csv-upload">
        <DragDropFilePicker
          onDrop={(files) => { this.onUpload(files); }}
          files={this.mapToArray()}
          showRetry={false}
          abortUpload={() => this.abortUpload()}
          abortSingleUpload={file => this.abortSingleUpload(file)}
          multiple
          accept=".csv"
          size={this.props.size}
        />
      </div>
    );
  }
}

CSVUpload.displayName = 'CSVUpload';

CSVUpload.propTypes = {
  onCSVChange: PropTypes.func.isRequired,
  onFilesDelete: PropTypes.func,
  size: PropTypes.oneOf(['auto', 'small', 'medium', 'large'])
};

class CSVUploadWithInstructions extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.downloadTemplate = this.downloadTemplate.bind(this);
    this.downloadLink = undefined;
  }

  componentDidMount() {
    if (this.props.downloadOnMount) {
      // HACKS
      // This delay is important in Safari. Refer to dataHref comment.
      setTimeout(this.downloadTemplate, 200);
    }
  }

  dataHref() {
    // HACKS
    // We Use the MIME type `txt/csv`, note the missing `e` in text,
    // so that safari will download the link instead of display.
    //
    // This seems to function by causing an error in Safari which then prevents
    // the loading of the file and falls back to downloading.
    // The downloaded file, in Safari, will be `Untitled`, but accurate.
    //
    // In addition, this error will cause `Frame load interrupted` and will
    // prevent more page rendering, ie the images.  This is why in the
    // componentDidMount we are downloading the template with a delay.
    return `data:txt/csv,${encodeURIComponent(this.props.payload)}`;
  }

  downloadTemplate() {
    if (navigator.msSaveBlob) {
      // Handle IE first
      const blob = new Blob([this.props.payload], {
        type: 'text/csv;charset=utf-8;'
      });

      navigator.msSaveBlob(blob, this.props.downloadName || 'download');
    } else if (this.downloadLink) {
      this.downloadLink.click();
    }
  }

  render() {
    return (
      <div className="csv-upload-with-instructions tx-stack tx-stack--md">
        <div>
          <p className="instruction">
            <strong>
              {this.props.instruction}
            </strong>
            <strong> Complete it, then upload it below. </strong>
          </p>
          <p className="instruction">
            <span>
              Your download should automatically start within seconds. If it does
              not,{' '}
            </span>
            <a
              ref={(ref) => {
                this.downloadLink = ref;
              }}
              href={this.dataHref()}
              download={
            this.props.downloadName != undefined
              ? this.props.downloadName
              : 'download'
          }
            >
              restart the download
            </a>
            <span>.</span>
          </p>
          <p>
            {
          "(If using Safari, append '.csv' to the 'Unknown' filename after downloading.)"
        }
          </p>
        </div>
        <div style={{ width: '80%' }}>
          <CSVUpload
            onCSVChange={this.props.onCSVChange}
            onFilesDelete={this.props.onFilesDelete}
            size="auto"
          />
        </div>
      </div>
    );
  }
}

CSVUploadWithInstructions.displayName = 'CSVUploadWithInstructions';

CSVUploadWithInstructions.propTypes = {
  instruction: PropTypes.string.isRequired,
  payload: PropTypes.string.isRequired,
  downloadName: PropTypes.string,
  downloadOnMount: PropTypes.bool,
  onCSVChange: PropTypes.func.isRequired,
  onFilesDelete: PropTypes.func
};

export default CSVUpload;
export {
  CSVUploadWithInstructions,
  parseAndSanitizeCSV
};
