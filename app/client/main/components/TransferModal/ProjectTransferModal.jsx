import PropTypes from 'prop-types';
import React, { useState } from 'react';

import { ButtonGroup, Button } from '@transcriptic/amino';
import SessionStore from 'main/stores/SessionStore';
import ProjectStore from 'main/stores/ProjectStore';
import AdminOrganizationActions from 'main/admin/actions/OrganizationActions';
import OrganizationStore from 'main/stores/OrganizationStore';
import ModalActions from 'main/actions/ModalActions';
import UserProjectActions from  'main/actions/ProjectActions';
import TransferModal from './TransferModal';

const getProjectName = (id) => {
  const project = ProjectStore.getById(id);
  return project ? project.get('name') : id;
};

const getReceivingId = (id) => {
  const project = ProjectStore.getById(id);
  const projectOrgId = project ? project.get('organization_id') : undefined;

  if (projectOrgId) {
    const organization = OrganizationStore.getById(projectOrgId);

    if (organization) {
      return organization.getIn(['customer', 'name']);
    }
  }
};

const searchOrganizations = (value) => {
  return AdminOrganizationActions.search(1, 5, { search: value, orderBy: 'name' })
    .then(response => {
      const currentOrgId = SessionStore.getOrg().get('id');
      return response.results.filter(org => org.id !== currentOrgId).map(org => org.name);
    });
};

function ProjectTransferModal(props) {

  const getCustomerId = (projectId) => {
    const project = ProjectStore.getById(projectId);
    const projectOrgId = project ? project.get('organization_id') : undefined;

    if (projectOrgId) {
      const organization = OrganizationStore.getById(projectOrgId);

      if (organization) {
        return organization.getIn(['customer', 'id']);
      }
    }

  };

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const renderDrawerFooter = (name, transferContainers) => {
    return (
      <ButtonGroup>
        <Button
          type="info"
          link
          onClick={() => {
            setIsDrawerOpen(false);
          }
        }
        >
          Cancel
        </Button>
        <Button
          type="danger"
          size="small"
          heavy
          onClick={() => {
            transferProject(name, transferContainers);
            setIsDrawerOpen(false);
            ModalActions.close('ProjectTransferModal');
          }}
        >
          Continue
        </Button>
      </ButtonGroup>
    );
  };

  const transferProject = (name, transferContainers) => {
    let id = OrganizationStore.findByName(name).get('id');
    if (name === getReceivingId(props.selection)) {
      id = getCustomerId(props.selection);
    }
    const actions = UserProjectActions;
    return actions.transfer(props.selection, id, transferContainers).done(() =>
      props.onTransfer(props.selection));
  };

  return (
    <TransferModal
      modalId="ProjectTransferModal"
      type="project"
      entity="Organization"
      selectionDescription={getProjectName(props.selection)}
      onSearch={searchOrganizations}
      onTransfer={() => setIsDrawerOpen(true)}
      receivingId={getReceivingId(props.selection)}
      disableOrgSearch={!SessionStore.isAdmin()}
      enableDrawer
      isDrawerOpen={isDrawerOpen}
      setIsDrawerOpen={setIsDrawerOpen}
      renderDrawerFooter={renderDrawerFooter}
      isProjectTransferModal
    />
  );
}

ProjectTransferModal.propTypes = {
  selection:  PropTypes.string,
  onTransfer: PropTypes.func
};

ProjectTransferModal.defaultProps = {
  onTransfer() {}
};

export default ProjectTransferModal;
