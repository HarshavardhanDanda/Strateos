import LabAPI from 'main/api/LabAPI';
import JsonAPIIngestor from 'main/api/JsonAPIIngestor';

const LabActions = {

  loadAllLabWithFeature(feature) {
    // NOTE: LabAPI call Notification action on failure.
    return LabAPI.loadAllLabWithFeature(feature)
      .done(result => JsonAPIIngestor.ingest(result));
  }
};

export default LabActions;
