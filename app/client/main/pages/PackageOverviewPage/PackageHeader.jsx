import { bindAll } from 'lodash';
import PropTypes   from 'prop-types';
import React       from 'react';

import { Button, ButtonGroup } from '@transcriptic/amino';
import ModalActions from 'main/actions/ModalActions';
import PackageActions from 'main/actions/PackageActions';

import FeatureConstants from '@strateos/features';
import AcsControls      from  'main/util/AcsControls';
import UploadReleaseModal from './UploadReleaseModal';
import ConfirmingModal from './ConfirmingModal';

const CONFIRMING_MODAL_ID = 'CONFIRMING_MODAL';
const UPLOAD_RELEASE_MODAL_ID = 'UPLOAD_RELEASE_MODAL';

class PackageHeader extends React.Component {
  constructor(props, context) {
    super(props, context);
    bindAll(
      this,
      'showDeleteModal',
      'show_make_public_modal',
      'show_make_private_modal'
    );
  }

  showDeleteModal() {
    ModalActions.open(`DELETE_${CONFIRMING_MODAL_ID}`);
  }

  show_make_public_modal() {
    ModalActions.open(`SHOW_PUBLIC_${CONFIRMING_MODAL_ID}`);
  }

  show_make_private_modal() {
    ModalActions.open(`SHOW_PRIVATE_${CONFIRMING_MODAL_ID}`);
  }

  render() {
    const canUploadNewRelease = AcsControls.isFeatureEnabled(FeatureConstants.UPLOAD_NEW_RELEASE_DESTROY_PACKAGE_PROTOCOL);
    const canManagePackage = canUploadNewRelease || AcsControls.isFeatureEnabled(FeatureConstants.PUBLISH_RELEASE_PACKAGE_PROTOCOL);

    return (
      <div className="package-details">
        <div className="object-overview-and-details">
          <div className="object-description">
            <section className="text-description">
              <h4>Description</h4>
              <div>{this.props.package.get('description')
                ? this.props.package.get('description')
                : 'N/A'}
              </div>
            </section>
          </div>
          <div className="object-summaries">
            <ButtonGroup>
              { canUploadNewRelease && (
              <div>
                <Button
                  type="primary"
                  size="small"
                  onClick={() => ModalActions.open(UPLOAD_RELEASE_MODAL_ID)}
                >
                  Upload New Release
                </Button>
                <UploadReleaseModal
                  packageId={this.props.package.get('id')}
                  router={this.context.router}
                />
              </div>
              )}
              { canManagePackage && (
              <span>
                { this.props.package.get('public') ?
                  (
                    <div>
                      <Button
                        type="secondary"
                        size="small"
                        onClick={this.show_make_private_modal}
                      >
                        Make Private
                      </Button>
                      <ConfirmingModal
                        modalId={`SHOW_PRIVATE_${CONFIRMING_MODAL_ID}`}
                        title={`Make Private: ${this.props.package.get('name')}`}
                        _package={this.props.package}
                        btnClass={'btn-info'}
                        btnText={'Yes, make it private'}
                        prompt={`Only users of ${Transcriptic.organization
                          .name} will be able to view and run protocols from this package.`}
                        onConfirm={afterFct => (
                          PackageActions.changePrivacy({
                            id: this.props.package.get('id'),
                            makePublic: false
                          }).always(afterFct)
                        )}
                      />
                    </div>
                  ) :
                  (
                    <div>
                      <Button
                        type="secondary"
                        size="small"
                        onClick={this.show_make_public_modal}
                      >
                        Make Public
                      </Button>
                      <ConfirmingModal
                        title={`Make Public: ${this.props.package.get('name')}`}
                        modalId={`SHOW_PUBLIC_${CONFIRMING_MODAL_ID}`}
                        _package={this.props.package}
                        btnClass={'btn-info'}
                        btnText={'Yes, make it public'}
                        prompt={`This will allow anyone with a Transcriptic account
                            to view and run protocols from this package.`}
                        onConfirm={afterFct => (
                          PackageActions.changePrivacy({
                            id: this.props.package.get('id'),
                            makePublic: true
                          }).always(afterFct))}
                      />
                    </div>
                  )}
              </span>
              )}
              { canUploadNewRelease && (
              <div>
                <ConfirmingModal
                  title={`Delete Package ${this.props.package.get('name')}`}
                  _package={this.props.package}
                  btnClass={'btn-danger'}
                  btnText={'Yes, delete this package'}
                  prompt={'Are you sure you want to delete this package?'}
                  onConfirm={() => PackageActions.delete(this.props.package.get('id'))}
                  modalId={`DELETE_${CONFIRMING_MODAL_ID}`}
                />
                <Button
                  type="danger"
                  size="tiny"
                  onClick={this.showDeleteModal}
                  icon="fa-trash-alt"
                >
                  Destroy
                </Button>
              </div>
              )}
            </ButtonGroup>
          </div>
        </div>
      </div>
    );
  }
}

PackageHeader.contextTypes = {
  router: PropTypes.object.isRequired
};

PackageHeader.propTypes = {
  package: PropTypes.object.isRequired
};

export default PackageHeader;
