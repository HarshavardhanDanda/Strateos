import LabConsumerAPI from 'main/api/LabConsumerAPI';
import SessionStore from 'main/stores/SessionStore';

const LabConsumerActions = {

  loadLabsForCurrentOrg() {
    return LabConsumerAPI.index({
      filters: {
        organization_id: SessionStore.getOrg().get('id')
      },
      includes: ['lab', 'organization'],
      sortBy: ['lab.name'],
      fields: { organizations: ['id', 'name', 'subdomain'] }
    });
  },

  loadLabsByOrg(orgId) {
    return LabConsumerAPI.index({
      filters: {
        organization_id: orgId
      },
      includes: ['lab', 'organization'],
      sortBy: ['lab.name'],
      fields: { organizations: ['id', 'name', 'subdomain'] }
    });

  },

  loadLabConsumersByLab(labId) {
    return LabConsumerAPI.index({
      filters: {
        lab_id: labId
      },
      includes: ['lab', 'organization'],
      fields: { organizations: ['id', 'name', 'subdomain'] }
    });
  }
};

export default LabConsumerActions;
