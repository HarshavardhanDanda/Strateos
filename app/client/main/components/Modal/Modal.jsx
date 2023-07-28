import _ from 'lodash';

import ModalActions from 'main/actions/ModalActions';
import ModalStore from 'main/stores/ModalStore';
import ConnectToStoresHOC from 'main/containers/ConnectToStoresHOC';

import {
  SinglePaneModalContent,
  MultiStepModalWrapperContent,
  FullScreenModalContent,
  MultiStepModalPaneContent
} from '@transcriptic/amino';

const getStateFromStores = (props) => {
  const modalObject = ModalStore.getById(props.modalId);
  const modalOpen = modalObject ?
    { modalOpen: modalObject.get('open'), data: modalObject.get('data') }
    : { modalOpen: false };

  return _.extend({}, modalOpen, props, {
    onMount: () => setTimeout(() => ModalActions.create(props.modalId, false)),
    onUnMount: () => setTimeout(() => ModalActions.remove(props.modalId)),
    onClose: () => ModalActions.close(props.modalId)
  }
  );
};

const ModalHoc = (ModalComponent) => {
  if (ModalComponent) {
    return ConnectToStoresHOC(ModalComponent, getStateFromStores);
  }
};

// Props that are cloned into the child Pane with the MultiPaneModal
//
// When attempting to use the MultiPaneModal where the direct children are not
// Panes, we need to pass down the cloned props that the the MultiPaneModal clones
// onto its children.
//
// This list is helpful when attempting to spread these cloned props downward
// to a child that is not directly a Pane, but contains a pane itself.
const clonedPropNames = [
  'setFinalState',
  'currFinalState',
  'onDismiss',
  'onNavigateBack',
  'onNavigateNext'
];

export const FullscreenModal = ModalHoc(FullScreenModalContent);
export const SinglePaneModal = ModalHoc(SinglePaneModalContent);
export const MultiStepModalWrapper = ModalHoc(MultiStepModalWrapperContent);
export const MultiStepModalPane = MultiStepModalPaneContent;
export { clonedPropNames };
