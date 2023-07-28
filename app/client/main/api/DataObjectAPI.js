import API from 'main/api/API';

class DataObjectAPI extends API {
  constructor() {
    super('data_objects');
  }
}

export default new DataObjectAPI();
