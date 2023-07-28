import PropTypes from 'prop-types';
import React, { useState, useEffect }     from 'react';

import AdminOrganizationActions from 'main/admin/actions/OrganizationActions';
import OrgCollaborationsActions from 'main/actions/OrgCollaborationsActions';
import SessionStore             from 'main/stores/SessionStore';
import ContainerStore           from 'main/stores/ContainerStore';
import { ButtonGroup, Button } from '@transcriptic/amino';
import ModalActions from 'main/actions/ModalActions';

import TransferModal from './TransferModal';

const MODAL_ID = 'ContainerTransferModal';

function ContainerTransferModal(props) {

  const [destinationOrgs, setDestinationOrgs] = useState([]);

  useEffect(() => {
    OrgCollaborationsActions.loadOrgCollaborations({ topic: 'TRANSFER_CONTAINER' }).then((orgCollaborationsData) =>
      orgCollaborationsData.data.forEach(orgCollaboration => {
        setDestinationOrgs(prevState => [...prevState, {
          name: orgCollaboration.attributes.dest_org_name,
          value: orgCollaboration.attributes.dest_org_id
        }]);
      })
    );
  }, []);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const renderDrawerFooter = (orgId) => {
    return (
      <ButtonGroup>
        <Button
          type="info"
          link
          onClick={() => {
            setIsDrawerOpen(false);
            ModalActions.close(MODAL_ID);
          }
        }
        >
          Cancel
        </Button>
        <Button
          type="primary"
          size="small"
          heavy
          onClick={() => {
            transferContainer(orgId);
            setIsDrawerOpen(false);
            ModalActions.close(MODAL_ID);
          }}
        >
          Continue
        </Button>
      </ButtonGroup>
    );
  };

  const transferContainer = (orgId) => {
    props.onTransfer(orgId);
  };

  const getSelectionDescription = () => {
    if (Array.isArray(props.selection)) {
      return props.selection.map((id) => {
        const container = ContainerStore.getById(id);
        return container ? container.get('label') : id;
      }).join(', ');
    } else {
      return `${props.selection} containers`;
    }
  };

  return (
    <TransferModal
      modalId={MODAL_ID}
      type="container"
      entity="Organization"
      selectionDescription={getSelectionDescription()}
      onSearch={value =>
        AdminOrganizationActions.search(1, 5, { search: value })
          .then(response => {
            const currentOrgId = SessionStore.getOrg().get('id');
            return response.results.filter(org => org.id !== currentOrgId).map(org => org.subdomain);
          })
      }
      onTransfer={() => {
        setIsDrawerOpen(true);
      }}
      disableOrgSearch
      enableDrawer
      isDrawerOpen={isDrawerOpen}
      setIsDrawerOpen={setIsDrawerOpen}
      renderDrawerFooter={renderDrawerFooter}
      destinationOrgs={destinationOrgs}
    />
  );
}

ContainerTransferModal.propTypes = {
  selection: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.string),
    PropTypes.number
  ]).isRequired,
  onTransfer: PropTypes.func.isRequired,
};

ContainerTransferModal.MODAL_ID = MODAL_ID;

ContainerTransferModal.defaultProps = {
  onTransfer() {}
};

export default ContainerTransferModal;
