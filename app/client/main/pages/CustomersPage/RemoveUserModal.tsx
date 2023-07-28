import _ from 'lodash';
import React, { useState } from 'react';
import Immutable from 'immutable';
import { SinglePaneModal } from 'main/components/Modal';
import ModalActions from 'main/actions/ModalActions';
import CollaboratorActions from 'main/actions/CollaboratorActions';
import RemoveUserModalContent from './RemoveUserModalContent';

interface Props {
  modalId: string;
  fetchUserList?: Function;
  data?: Immutable.Map<string, string | Immutable.List<string>>;
}

function RemoveUserModal(props: Props) {
  const [userId, setUserId] = useState('');
  const [selected, setSelected] = useState({});

  const onRemove = () => {
    const orgIds = Object.keys(selected);
    return CollaboratorActions.removeCollaboratorsForUser(userId, orgIds).done(
      () => props.fetchUserList()
    );
  };

  return (
    <SinglePaneModal
      modalId={props.modalId}
      title="Remove user"
      onAccept={onRemove}
      onDismissed={() => ModalActions.close(props.modalId)}
      acceptText="Remove"
      acceptClass="btn btn-danger"
      type="danger"
      acceptBtnDisabled={_.isEmpty(Object.keys(selected))}
    >
      <RemoveUserModalContent
        selected={(selected, userId) => { setSelected(selected); setUserId(userId); }}
      />
    </SinglePaneModal>
  );
}

export default RemoveUserModal;
