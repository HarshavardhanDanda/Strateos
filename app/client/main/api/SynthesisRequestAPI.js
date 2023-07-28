import API from 'main/api/API';

class SynthesisRequestAPI extends API {
  constructor() {
    super('synthesis_requests');
  }
}

export default new SynthesisRequestAPI();
