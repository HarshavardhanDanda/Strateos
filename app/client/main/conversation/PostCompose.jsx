import React from 'react';
import _ from 'lodash';
import PropTypes from 'prop-types';

import FileUpload from 'main/components/upload';
import TextArea from 'react-textarea-autosize';
import NotificationActions from 'main/actions/NotificationActions';

import { Button, DragDropFilePicker } from '@transcriptic/amino';
import SessionStore from 'main/stores/SessionStore';
import './PostCompose.scss';

function Actions({ posting, uploading, submit, onFilesSelected, canSubmit, files }) {
  let btnMessage;
  if (posting) {
    btnMessage = 'Sending...';
  } else if (uploading) {
    btnMessage = 'Uploading...';
  } else {
    btnMessage = 'Send';
  }

  return (
    <div className="actions action-view">
      {!files.length && (
        <DragDropFilePicker
          onDrop={(filesUploaded) => { onFilesSelected(filesUploaded); }}
          files={[]}
          multiple={false}
          size="auto"
        />
      )}
      <Button
        type="default"
        size="small"
        className="btn-send button-margin"
        onClick={submit}
        disabled={!canSubmit}
      >
        {btnMessage}
      </Button>
    </div>
  );
}

Actions.propTypes = {
  submit: PropTypes.func.isRequired,
  onFilesSelected: PropTypes.func.isRequired,
  posting: PropTypes.bool,
  uploading: PropTypes.bool,
  canSubmit: PropTypes.bool,
  files: PropTypes.array
};

class PostCompose extends React.Component {
  static get propTypes() {
    return {
      onSubmit: PropTypes.func.isRequired
    };
  }

  constructor(props) {
    super(props);
    _.bindAll(
      this,
      'showActions',
      'onFilesSelected',
      'submit',
      'onCommentsChanged',
      'onUploadDone',
      'onUploadAborted'
    );

    this.state = {
      attachments: [],
      comments: '',
      files: [],
      posting: false,
      showActions: false,
      uploading: false
    };
  }

  componentWillMount() {
    window.onbeforeunload = undefined;
  }

  componentDidUpdate() {
    if (this.state.uploading) {
      window.onbeforeunload = () => 'You have uploads in progress';
    } else {
      window.onbeforeunload = undefined;
    }
  }

  onCommentsChanged(event) {
    this.setState({ comments: event.target.value });
  }

  onFilesSelected(files) {
    this.setState({
      files: this.state.files.concat(files),
      uploading: true
    });
  }

  onUploadDone({ id, uploadFile }) {
    const attachments = this.state.attachments.slice();
    const file = uploadFile.file;
    attachments.push({
      upload_id: id,
      name: file.name,
      size: file.size
    });

    this.setState({ uploading: false, attachments });
  }

  onUploadAborted() {
    this.setState({ uploading: false, files: [], attachments: [] });
  }

  showActions() {
    this.setState({ showActions: true });
  }

  submit() {
    const data = {
      viewable_by_users: false,
      text: this.state.comments || 'N/A',
      attachments: this.state.attachments
    };

    this.props.onSubmit(data)
      .always(() => {
        this.setState({
          posting: false,
          comments: '',
          attachments: [],
          files: [],
          doneCount: 0
        });
      })
      .fail(() => {
        NotificationActions.createNotification({
          text: 'An error occurred while posting your message',
          isError: true
        });
      });
    this.setState({ posting: true });
  }

  render() {
    const { uploading, posting, comments, attachments } = this.state;

    const canSubmit = !(uploading || posting) &&
      (comments.length > 0 || attachments.length > 0);

    return (
      <div
        className="add-post admin attachment-uploader"
        onFocus={this.showActions}
      >
        <div className="author">
          {SessionStore.getUser().get('name')}
        </div>
        <TextArea
          disabled={this.state.posting}
          onChange={this.onCommentsChanged}
          className="comment-area"
          placeholder="Description is mandatory. Please provide more details."
          value={this.state.comments}
        />
        <div className="files">
          {this.state.files.map((uploadFile, index) => {
            const file = uploadFile.file;
            const date = new Date(Math.round(file.lastModified / 1000));
            return (
              <FileUpload
                key={`${file.name}-${date}-${index}`} // eslint-disable-line react/no-array-index-key
                file={file}
                onUploadDone={this.onUploadDone}
                onUploadAborted={this.onUploadAborted}
              />
            );
          })
          }
        </div>
        <If condition={this.state.showActions}>
          <Actions
            posting={this.state.posting}
            uploading={this.state.uploading}
            submit={this.submit}
            canSubmit={canSubmit}
            onFilesSelected={this.onFilesSelected}
            files={this.state.files}
          />
        </If>
      </div>
    );
  }
}

export default PostCompose;
