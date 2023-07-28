import PropTypes from 'prop-types';
import React     from 'react';

import ModalActions from 'main/actions/ModalActions';
import Urls from 'main/util/urls';
import ValidateRelease from 'main/components/validate_release';
import ReleaseActions from 'main/actions/ReleaseActions';
import ReleaseStore from 'main/stores/ReleaseStore';
import SessionStore from 'main/stores/SessionStore';
import AttachmentUploader from 'main/components/AttachmentUploader';
import { SinglePaneModal } from 'main/components/Modal';

const UPLOAD_RELEASE_MODAL_ID = 'UPLOAD_RELEASE_MODAL';

class UploadReleaseModal extends React.Component {

  static get propTypes() {
    return {
      router: PropTypes.object.isRequired,
      packageId: PropTypes.string.isRequired
    };
  }

  constructor(props) {
    super(props);

    this.onFilesSelected = this.onFilesSelected.bind(this);
    this.onUploadDone = this.onUploadDone.bind(this);
    this.onUploadAborted = this.onUploadAborted.bind(this);
    this.onValidateSuccess = this.onValidateSuccess.bind(this);
    this.onValidate = this.onValidate.bind(this);

    this.state = {
      uploadId: undefined,
      files: [],
      uploading: false,
      validating: false,
      releaseId: undefined
    };
  }

  onFilesSelected(files) {
    this.setState({
      files,
      uploading: true
    });
  }

  onUploadDone({ id }) {
    this.setState({
      uploading: false,
      uploadId: id
    });
  }

  onUploadAborted() {
    this.setState({
      uploading: false,
      files: [],
      validating: false,
      releaseId: undefined,
      uploadId: undefined
    });
  }

  onValidateSuccess() {
    ModalActions.close(UPLOAD_RELEASE_MODAL_ID);
    this.props.router.history.push(
      Urls.release(this.props.packageId, this.state.releaseId)
    );
  }

  onValidate() {
    this.setState({ validating: true, releaseId: undefined });

    return ReleaseActions.validate(this.props.packageId, this.state.uploadId, SessionStore.getUser().get('id'))
      .fail(() => this.setState({ validating: false, uploadId: undefined }))
      .done(fetchedRelease => this.setState({ releaseId: fetchedRelease.id }));
  }

  render() {
    const release = ReleaseStore.getById(this.state.releaseId);

    return (
      <SinglePaneModal
        modalSize="large"
        modalId={UPLOAD_RELEASE_MODAL_ID}
        title="Upload Release"
        onAccept={() => this.onValidate()}
        acceptText={this.state.validating ? 'Validating' : 'Validate'}
        acceptBtnDisabled={this.state.uploadId == undefined || this.state.validating}
        disableDismiss
      >
        <form className="form-horizontal tx-stack tx-stack--xxs">
          <div className="form-group row">
            <span className="col-sm-2 control-label">
              Upload Release
            </span>
            <AttachmentUploader
              className="col-sm-6"
              fileType="Zip"
              accept=".zip"
              multiple={false}
              files={this.state.files}
              onUploadDone={this.onUploadDone}
              onUploadAborted={this.onUploadAborted}
              onFilesSelected={this.onFilesSelected}
              title="Upload release"
              uploading={this.state.uploading}
            />
            <div className="col-sm-4 helper">
              A release is a compressed ZIP archive of the protocol source
              code.
              {' '}
              <a
                href="https://developers.strateos.com/docs/package-creation-quickstart"
                target="_new"
              >
                Learn about packaging a release.
              </a>
            </div>
          </div>
          <If condition={release}>
            <ValidateRelease
              release={release}
              onFailure={() => this.setState({ validating: false, uploadId: undefined })}
              onSuccess={data => this.onValidateSuccess(data)}
            />
          </If>
        </form>
      </SinglePaneModal>
    );
  }
}

export default UploadReleaseModal;
