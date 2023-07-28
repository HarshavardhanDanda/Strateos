import ajax from 'main/util/ajax';
import API from 'main/api/API';
import Urls from 'main/util/urls';

class SynthesisProgramAPI extends API {
  constructor() {
    super('synthesis_programs');
  }

  getSynthesisProgramByOrganization(organization_id, options = { version: 'v1' }) {
    return this.index({ ...options, organization_id: organization_id });
  }

  addBatchToSynthesisProgram(synthesis_program_id, batch_id) {
    const url = Urls.synthesis_program_item(synthesis_program_id, 'batches');
    const data = [{
      type: 'batches',
      id: batch_id
    }];
    return ajax.post(url, { data });
  }

  removeBatchFromSynthesisProgram(synthesis_program_id, batch_id) {
    const url = Urls.synthesis_program_item(synthesis_program_id, 'batches');
    const data = [{
      type: 'batches',
      id: batch_id
    }];
    return ajax.delete(url, { data });
  }
}

export default new SynthesisProgramAPI();
