import OrgCollaborationsAPI from 'main/api/OrgCollaborationsAPI';

const OrgCollaborationsActions = {

  loadOrgCollaborations(options = {}) {
    return OrgCollaborationsAPI.index({
      filters: options
    });
  }
};

export default OrgCollaborationsActions;
