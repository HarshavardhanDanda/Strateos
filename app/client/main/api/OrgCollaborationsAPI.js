import API from 'main/api/API';

class OrgCollaborationsAPI extends API {

  constructor() {
    super('org_collaborations');
  }
}

export default new OrgCollaborationsAPI();
