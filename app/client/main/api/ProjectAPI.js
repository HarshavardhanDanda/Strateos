import API from 'main/api/API';

class ProjectAPI extends API {
  constructor() {
    super('projects');
  }
}

export default new ProjectAPI();
