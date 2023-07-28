import PropTypes from 'prop-types';
import React     from 'react';

import FileUpload from 'main/components/upload';
import { DragDropFilePicker } from '@transcriptic/amino';

class FilePickUpload extends React.Component {

  static get propTypes() {
    return {
      size: PropTypes.oneOf(['small', 'medium', 'large', 'auto']),
      fileType: PropTypes.string,
      onAllUploadsDone: PropTypes.func.isRequired,
      multiple:         PropTypes.bool,
      accept:           PropTypes.string
    };
  }

  static get defaultProps() {
    return {
      multiple: false,
      fileType: 'files',
      size: 'small'
    };
  }

  constructor(props) {
    super(props);
    this.onFileUploaded = this.onFileUploaded.bind(this);
    this.state = {
      uploading: false,
      files: [],
      completedFileInfos: []
    };
  }

  onFileUploaded(file, key) {
    this.state.completedFileInfos.push({ name: file.name, key });
    return this.setState({ completedFileInfos: this.state.completedFileInfos }, () => {
      if (this.state.completedFileInfos.length === this.state.files.length) {
        this.setState({ uploading: false });
        return this.props.onAllUploadsDone(this.state.completedFileInfos);
      }
      return undefined;
    });
  }

  render() {
    return (
      <div className="attachment-uploader">
        <div>
          {(this.state.files.length > 0) ?
            this.state.files.map((uploadFile) => {
              const file = uploadFile.file;
              return (
                <FileUpload
                  key={file.name}
                  file={file}
                  onUploadDone={
                    data => this.onFileUploaded(data.file, data.key)
                  }
                  onUploadAborted={() => {
                    return this.setState({ uploading: false, files: [], completedFileInfos: [] });
                  }}
                />
              );
            }) : undefined }
        </div>
        {(!this.state.uploading && this.state.files.length === 0) && (
          <DragDropFilePicker
            size={this.props.size}
            files={[]}
            fileType={this.props.fileType}
            multiple={this.props.multiple}
            accept={this.props.accept}
            onDrop={(files) => {
              this.setState({ files, uploading: true });
            }}
          />
        )}
      </div>
    );
  }
}

export default FilePickUpload;
