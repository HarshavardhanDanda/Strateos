import classNames from 'classnames';
import PropTypes  from 'prop-types';
import React      from 'react';

import NotificationActions from 'main/actions/NotificationActions';
import String              from 'main/util/String';
import * as Uploader       from 'main/util/uploader';

/*
 * This represents a single file upload. You construct it with a file and an onUploadDone callback,
 * and it will render the file and file size, along with a background progress bar for the upload
 * progress. Once done the upload will be completed and the S3 key will be provided to the
 * onUploadDone callback.
 */
class FileUpload extends React.Component {

  static get propTypes() {
    return {
      file: PropTypes.object.isRequired,
      onUploadAborted: PropTypes.func,
      onUploadDone: PropTypes.func
    };
  }

  constructor(props) {
    super(props);
    this.abortUpload = this.abortUpload.bind(this);
    this.state = {
      aborted: false,
      percentDone: 0,
      uploader: undefined,
      url: undefined
    };
  }

  componentWillMount() {
    const uploader = Uploader.uploadFile(this.props.file, this.props.file.name);

    uploader.progress((data) => {
      return this.setState({ percentDone: data.percentDone });
    });

    uploader.done((data) => {
      this.setState({ url: data.url });

      if (this.props.onUploadDone) {
        this.props.onUploadDone({
          id: data.id,
          file: this.props.file,
          key: data.key,
          url: data.url
        });
      }
    });

    return this.setState({ uploader });
  }

  componentWillUnmount() {
    // Abort the upload if it's not done
    if (!this.state.aborted && !this.state.url) {
      return this.abortUpload();
    }
    return undefined;
  }

  abortUpload() {
    if (this.state.uploader) {
      this.setState({ aborted: true });
      return this.state.uploader.abort()
        .done(() => this.props && this.props.onUploadAborted(this.props.file))
        .fail(() =>
          NotificationActions.createNotification({
            text: 'Error aborting upload',
            isError: true
          })
        );
    }
    return undefined;
  }

  render() {
    return (
      <div className="attachment-uploader__file">
        <div
          className="attachment-uploader__upload-progress"
          style={{ width: `${this.state.percentDone}%` }}
        />
        {
          !this.state.aborted &&
            <div className="attachment-uploader__x" onClick={this.abortUpload}>x</div>
        }
        <div className={classNames({ 'attachment-uploader__name': true, 'attachment-uploader__link': this.state.url })}>
          {
            this.state.url ?
              <a href={this.state.url}>{this.props.file.name}</a> :
              this.props.file.name
          }
        </div>
        <div className="attachment-uploader__size">{`(${String.humanFileSize(this.props.file.size)})`}</div>
      </div>
    );
  }
}

export default FileUpload;
