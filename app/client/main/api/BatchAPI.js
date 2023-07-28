import ajax from 'main/util/ajax';
import API from 'main/api/API';

class BatchAPI extends API {
  constructor() {
    super('batches');
  }

  updateContextualCustomProperties(batchId, key, value, options = { version: 'v1' }) {
    const url = this.createUrl(`/${batchId}/contextual_custom_properties_configs/${key}`, options);
    return ajax.post(url, { value });
  }
}

export default new BatchAPI();
