import PropTypes from 'prop-types';
import React     from 'react';

import { FormGroup, DragDropFilePicker } from '@transcriptic/amino';
import FileUpload from 'main/components/upload';

/*
No current uploads, or multiple uploads allowed: Render a file picker
If one or many files have been uploaded, or are uploading: Render them in a FileUpload component
*/
class AttachmentUploader extends React.Component {
  static get propTypes() {
    return {
      files: PropTypes.array,
      onUploadDone: PropTypes.func,
      onUploadAborted: PropTypes.func,
      onFilesSelected: PropTypes.func,
      multiple: PropTypes.bool,
      uploading: PropTypes.bool,
      size: PropTypes.oneOf(['small', 'medium', 'large', 'auto']),
      fileType: PropTypes.string,
      accept: PropTypes.string,
      formLabel: PropTypes.string,
      className: PropTypes.string
    };
  }

  static get defaultProps() {
    return {
      fileType: 'files',
      size: 'small',
      multiple: true,
      files: []
    };
  }

  renderFileUpload(uploadFile, index) {
    const file = uploadFile.file;
    const key = `${file ? file.name : ''}-${file ? new Date(Math.round(file.lastModified / 1000)) : ''}_${index}`;

    return (
      <FileUpload
        key={key}
        file={file}
        onUploadDone={this.props.onUploadDone}
        onUploadAborted={this.props.onUploadAborted}
      />
    );
  }

  renderUploads() {
    // if multiple files are allowed and at least one has been provided, render all
    // of them that have been supplied. Do not render a file picker, that will be
    // rendered later for multiple uploads
    if (this.props.multiple && this.props.files.length) {
      return (
        <div className="attachment-uploader__files">
          {
            this.props.files.map((file, index) => {
              return this.renderFileUpload(file, index);
            })
          }
        </div>
      );
    }

    // If multiple uploads are not allowed, check if a file has been provided, or
    // if a file is in the process of uploading. If so, render the uploader for
    // the first file in the array - as only one should be present
    if (this.props.uploading || this.props.files.length) {
      return (
        <div className="files">
          {this.renderFileUpload(this.props.files[0], 1)}
        </div>
      );
    }

    // If multiple uploads are not allowed, and there is no file uploading or present
    // return false
    return false;
  }

  render() {
    const uploads = this.renderUploads();
    return (
      <FormGroup className={this.props.className} label={this.props.formLabel}>
        <div className="attachment-uploader">
          {uploads}
          {(!uploads || this.props.multiple) && (
            <DragDropFilePicker
              onDrop={this.props.onFilesSelected}
              files={[]}
              multiple={this.props.multiple}
              accept={this.props.accept}
              size={this.props.size}
              fileType={this.props.fileType}
            />
          )}
        </div>
      </FormGroup>
    );
  }

}

export default AttachmentUploader;
