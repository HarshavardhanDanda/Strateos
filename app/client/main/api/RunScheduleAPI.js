import API from 'main/api/API';

class RunScheduleAPI extends API {
  constructor() {
    super('run_schedules');
  }
}

export default new RunScheduleAPI();
