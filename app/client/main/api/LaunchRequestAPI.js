import API from 'main/api/API';

class LaunchRequestAPI extends API {
  constructor() {
    super('launch_requests');
  }
}

export default new LaunchRequestAPI();
