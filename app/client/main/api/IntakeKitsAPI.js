import API from 'main/api/API';
import ajax from 'main/util/ajax';
import FeatureStore from 'main/stores/FeatureStore.js';
import JsonAPIIngestor from './JsonAPIIngestor';

class IntakeKitsAPI extends API {
  constructor() {
    super('intake_kits');
  }

  loadAllLabRelatedIntakeKits() {
    const labIds = FeatureStore.getLabIds().toJS();
    const options = {
      filter: {
        admin_processed_at: null,
        lab_id: labIds
      },
      limit: 5000
    };
    const url = this.createUrl('', options);

    return ajax.get(url, options)
      .done(payload => {
        JsonAPIIngestor.ingest(payload);
      });
  }
}

export default new IntakeKitsAPI();
