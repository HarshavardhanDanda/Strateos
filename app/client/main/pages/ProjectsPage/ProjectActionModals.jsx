import PropTypes from 'prop-types';
import React     from 'react';

import NotificationActions      from 'main/actions/NotificationActions';
import ProjectActions from 'main/actions/ProjectActions';

import { SinglePaneModal } from 'main/components/Modal';

const propTypes  = {
  projectId: PropTypes.string.isRequired,
  onDone: PropTypes.func
};

function ConfirmArchiveModal(props) {
  return (
    <SinglePaneModal
      modalId="ConfirmArchiveModal"
      title="Archive Project"
      onAccept={() => {
        ProjectActions.archive(props.projectId)
          .done(props.onDone)
          .fail((...errors) => {
            NotificationActions.handleError(errors);
          });
      }}
      acceptText="Archive"
    >
      <h3>Are you sure you want to archive this project?</h3>
      <p>You can always unarchive it later.</p>
    </SinglePaneModal>
  );
}

ConfirmArchiveModal.propTypes = propTypes;

function ConfirmUnarchiveModal(props) {
  return (
    <SinglePaneModal
      modalId="ConfirmUnarchiveModal"
      title="Unarchive Project"
      onAccept={() => {
        ProjectActions.unarchive(props.projectId)
          .done(props.onDone)
          .fail((...errors) => {
            NotificationActions.handleError(errors);
          });
      }}
      acceptText="Unarchive"
    >
      <h3>Are you sure you want to un-archive this project?</h3>
      <p>You can always archive it again later.</p>
    </SinglePaneModal>
  );
}

ConfirmUnarchiveModal.propTypes = propTypes;

function ConfirmDeletionModal(props) {
  return (
    <SinglePaneModal
      modalId="ConfirmDeletionModal"
      title="Destroy Project"
      onAccept={() => {
        return ProjectActions.destroy(props.projectId)
          .done(props.onDone)
          .fail((...errors) => {
            NotificationActions.handleError(errors);
          });
      }}
      acceptText="Destroy"
    >
      <h3>Are you sure you want to delete this project?</h3>
      <p>You won&apos;t be able to recover it.</p>
    </SinglePaneModal>
  );
}

ConfirmDeletionModal.propTypes = propTypes;

export { ConfirmArchiveModal, ConfirmUnarchiveModal, ConfirmDeletionModal };
