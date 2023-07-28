import API from 'main/api/API';

class ResourceAPI extends API {
  constructor() {
    super('resources');
  }
}

export default new ResourceAPI();
