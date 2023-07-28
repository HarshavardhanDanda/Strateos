import React, { useState } from 'react';
import _ from 'lodash';
import { SinglePaneModal } from 'main/components/Modal';
import { Spinner, TextBody, ModalHeader, ButtonGroup, Button } from '@transcriptic/amino';
import BulkActionReportUtil from 'main/pages/InventoryPage/BulkActionReportUtil';
import ModalActions from 'main/actions/ModalActions';
import './BulkActionLoaderModal.scss';

const MODAL_ID = 'BULK_ACTION_LOADER_MODAL';

export interface BulkActionLoaderModalProps {
  action: string;
  bulkSelectionCount: number;
}

function BulkActionLoaderModal(props: BulkActionLoaderModalProps) {
  const { action, bulkSelectionCount } = props;
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const formattedAction = _.capitalize(action);

  const renderModalText = () => {
    let actionPerformed = '';
    switch (action) {
      case BulkActionReportUtil.ACROSS_PAGES_ACTIONS.DELETE:
        actionPerformed = 'deleted';
        break;
      case BulkActionReportUtil.ACROSS_PAGES_ACTIONS.DESTROY:
        actionPerformed = 'destroyed';
        break;
      case BulkActionReportUtil.ACROSS_PAGES_ACTIONS.DOWNLOAD:
        actionPerformed = 'downloaded';
        break;
      case BulkActionReportUtil.ACROSS_PAGES_ACTIONS.TRANSFER:
        actionPerformed = 'transferred';
        break;
      case BulkActionReportUtil.ACROSS_PAGES_ACTIONS.RELOCATE:
        actionPerformed = 'relocated';
        break;
    }

    return `${bulkSelectionCount} containers are being ${actionPerformed}, this process will take awhile. 
      Refreshing or navigating away from this page may not display desired results.`;
  };

  const renderModalHeader = () => {
    return (
      <ModalHeader onDismiss={() => setIsDrawerOpen(true)} />
    );
  };

  const renderDrawerContent = () => {
    return (
      <TextBody>{`${formattedAction} is still in progress. Are you sure you want to close the modal?`}</TextBody>
    );
  };

  const onContinue = () => {
    setIsDrawerOpen(false);
    ModalActions.close(MODAL_ID);
  };

  const renderDrawerFooter = () => {
    return (
      <ButtonGroup>
        <Button
          type="info"
          link
          onClick={() => setIsDrawerOpen(false)}
        >
          Cancel
        </Button>
        <Button
          type="primary"
          size="small"
          heavy
          onClick={onContinue}
        >
          Continue
        </Button>
      </ButtonGroup>
    );
  };

  const drawerProps = {
    hasDrawer: true,
    drawerState: isDrawerOpen,
    drawerTitle: 'Are you sure?',
    drawerChildren: renderDrawerContent(),
    drawerFooterChildren: renderDrawerFooter(),
    onDrawerClose: () => setIsDrawerOpen(false),
  };

  return (
    <SinglePaneModal
      modalId={MODAL_ID}
      title={_.capitalize(formattedAction)}
      modalSize={'medium'}
      closeOnClickOut={false}
      closeOnEsc={false}
      headerRenderer={renderModalHeader}
      {...drawerProps}
    >
      <Spinner />
      <div className="bulk-action-loader-modal">
        <TextBody>{renderModalText()}</TextBody>
      </div>
    </SinglePaneModal>
  );
}

BulkActionLoaderModal.MODAL_ID = MODAL_ID;

export default BulkActionLoaderModal;
