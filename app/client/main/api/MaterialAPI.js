import API from 'main/api/API';

class MaterialAPI extends API {
  constructor() {
    super('materials');
  }
}

export default new MaterialAPI();
