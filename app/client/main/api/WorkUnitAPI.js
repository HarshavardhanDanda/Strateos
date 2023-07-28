import API from './API';

class WorkUnitAPI extends API {
  constructor() {
    super('work_units');
  }
}

export default new WorkUnitAPI();
