import Immutable from 'immutable';
import _         from 'lodash';
import PropTypes from 'prop-types';
import React     from 'react';

import AttachmentUploader  from 'main/components/AttachmentUploader';
import RunActions          from 'main/actions/RunActions';
import ModalActions        from 'main/actions/ModalActions';
import { SinglePaneModal } from 'main/components/Modal';

class FlowAnalyzeDataModal extends React.Component {
  static get propTypes() {
    return {
      instruction:         PropTypes.instanceOf(Immutable.Map).isRequired,
      title:               PropTypes.string,
      modalId:             PropTypes.string.isRequired,
      onInstructionUpdate: PropTypes.func
    };
  }

  constructor(props) {
    super(props);
    this.state = {
      fileInfo: {},
      file: undefined,
      uploading: false
    };
  }

  onConfirm() {
    const id   = this.props.instruction.get('id');
    const data = this.convertStateToData();

    RunActions.attachInstructionData(id, data).done((instruction) => {
      this.props.onInstructionUpdate(instruction);
      ModalActions.close(this.props.modalId);
    });
  }

  convertStateToData() {
    return {
      data: {
        name: this.state.fileInfo.name,
        upload_id: this.state.fileInfo.upload_id
      }
    };
  }

  confirmDisabled() {
    return this.state.uploading;
  }

  render() {
    return (
      <SinglePaneModal
        modalId={this.props.modalId}
        title={this.props.title}
        onAccept={() => this.onConfirm()}
        acceptText="Confirm"
        acceptBtnDisabled={this.confirmDisabled()}
      >
        <AttachmentUploader
          files={this.state.file ? [this.state.file] : []}
          onUploadDone={
            ({ id, file }) => {
              return this.setState({
                uploading: false,
                fileInfo: {
                  name: file.name,
                  upload_id: id
                }
              });
            }
          }
          onUploadAborted={
            (_file, _key) => {
              return this.setState({
                uploading: false,
                file: undefined
              });
            }}
          title="Flow Cytometry Data File"
          onFilesSelected={
            (files) => {
              return this.setState({
                file: files[0],
                uploading: true
              });
            }
          }
          multiple={false}
        />
      </SinglePaneModal>
    );
  }
}

export default FlowAnalyzeDataModal;
