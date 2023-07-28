import API from './API';

class LabConsumerAPI extends API {
  constructor() {
    super('lab_consumers');
  }
}

export default new LabConsumerAPI();
