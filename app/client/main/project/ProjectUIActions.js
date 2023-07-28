import _ from 'lodash';

import ModalActions from 'main/actions/ModalActions';
import AcsControls  from 'main/util/AcsControls';
import FeatureConstants from '@strateos/features';
import RunTransferModal from 'main/components/RunTransferModal';
import ProjectActions from 'main/actions/ProjectActions';
import CommonUiUtil from 'main/util/CommonUiUtil';

const getProjectActions = (project, callbacks = {}) => {
  const archived_at = project.get('archived_at');
  const runCount    = project.get('run_count');
  const totalRunCount = runCount && runCount.reduce((accum, currVal) => { return accum + currVal; });
  const isHidden = project.get('is_implementation');
  const onUnhideProject = () => {
    const msg = 'Are you sure you want to expose this project to the client Organization?';
    if (CommonUiUtil.confirmWithUser(msg)) {
      ProjectActions
        .update(project.get('id'), { is_implementation: false })
        .done(() => {
          const postUnhideCallback = _.get(callbacks, 'onUnhideProject');
          postUnhideCallback && postUnhideCallback();
        });
    }
  };

  return [
    {
      icon: 'fa fa-archive',
      text: 'Archive Project',
      onClick: () => { ModalActions.open('ConfirmArchiveModal'); },
      disabled: archived_at || !totalRunCount
    },
    {
      icon: 'fa fa-archive',
      text: 'Unarchive Project',
      onClick: () => { ModalActions.open('ConfirmUnarchiveModal'); },
      disabled: !archived_at
    },
    {
      icon: 'fa fa-trash',
      text: 'Destroy Project',
      onClick: () => { ModalActions.open('ConfirmDeletionModal'); },
      disabled: !!totalRunCount
    },
    {
      icon: 'fa fa-exchange-alt',
      text: 'Transfer Project',
      onClick: () => { ModalActions.open('ProjectTransferModal'); },
      disabled: !AcsControls.isFeatureEnabled(FeatureConstants.TRANSFER_PROJECT)
    },
    {
      icon: 'fa fa-cogs',
      text: 'Project Settings',
      onClick: () => { ModalActions.open('EditProjectModal'); }
    },
    {
      icon: 'fa fa-truck',
      text: 'Transfer run',
      onClick: () => { ModalActions.open(RunTransferModal.MODAL_ID); },
      disabled: !AcsControls.isFeatureEnabled(FeatureConstants.CREATE_EDIT_PROJECT)
    },
    {
      icon: 'fa fa-eye',
      text: 'Unhide Project',
      onClick: onUnhideProject,
      disabled: !(AcsControls.isFeatureEnabled(FeatureConstants.MANAGE_IMPLEMENTATION_PROJECTS_IN_LAB) && isHidden)
    }
  ];
};

export default getProjectActions;
