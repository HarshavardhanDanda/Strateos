import API from 'main/api/API';

class CreditAPI extends API {
  constructor() {
    super('credits');
  }
}

export default new CreditAPI();
