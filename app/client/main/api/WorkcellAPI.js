import API from 'main/api/API';

class WorkcellAPI extends API {
  constructor() {
    super('workcells');
  }
}

export default new WorkcellAPI();
