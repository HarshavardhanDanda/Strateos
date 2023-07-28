import API from 'main/api/API';

class AuditsAPI extends API {
  constructor() {
    super('audits');
  }
}

export default new AuditsAPI();
