import API from './API';

class UserAPI extends API {
  constructor() {
    super('users');
  }
}

export default new UserAPI();
