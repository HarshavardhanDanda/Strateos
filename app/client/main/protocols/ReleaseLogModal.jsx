import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React     from 'react';

import { SinglePaneModal } from 'main/components/Modal';
import ValidateRelease from 'main/components/validate_release';

const MODAL_ID = 'RELEASE_LOG_MODAL';

class ReleaseLogModal extends React.Component {
  render() {
    return (
      <SinglePaneModal
        modalId={MODAL_ID}
        modalSize="large"
        title="Release Validation"
      >
        <ValidateRelease release={this.props.release} />
      </SinglePaneModal>
    );
  }
}

ReleaseLogModal.propTypes = {
  release: PropTypes.instanceOf(Immutable.Map).isRequired
};

ReleaseLogModal.MODAL_ID = MODAL_ID;

export default ReleaseLogModal;
