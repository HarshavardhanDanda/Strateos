import ajax from 'main/util/ajax';
import NotificationActions from 'main/actions/NotificationActions';
import Urls from 'main/util/urls';

const BulkDataIngestorActions = {
  validateZip(formData) {
    return ajax.postFormData(Urls.bulk_data_ingestor_validate(), formData)
      .fail((xhr, status, text) => {
        NotificationActions.handleError(xhr, status, text);
      });
  },
  uploadZip(formData) {
    return ajax.postFormData(Urls.bulk_data_ingestor_upload(), formData)
      .fail((xhr, status, text) => {
        NotificationActions.handleError(xhr, status, text);
      });
  }
};

export default BulkDataIngestorActions;
