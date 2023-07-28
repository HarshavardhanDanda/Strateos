import NotificationActions from 'main/actions/NotificationActions';
import HTTPUtil from 'main/util/HTTPUtil';
import Urls from 'main/util/urls.js';
import Dispatcher from 'main/dispatcher';

const AuditTrailActions = {
  loadAuditConfiguration(org_id) {
    return HTTPUtil.get(Urls.audit_configuration(org_id))
      .done((auditConfig) => {
        Dispatcher.dispatch({ type: 'AUDIT_CONFIGURATION_DATA', auditConfig });
      })
      .fail((xhr, status, text) => {
        NotificationActions.handleError(xhr, status, text);
      });
  },

  loadAuditConfigurationHistory(org_id) {
    return HTTPUtil.get(Urls.audit_configuration_history(org_id))
      .done((auditConfigHistory) => { Dispatcher.dispatch({ type: 'AUDIT_CONFIGURATION_HISTORY_LIST', auditConfigHistory }); })
      .fail((xhr, status, text) => {
        NotificationActions.handleError(xhr, status, text);
      });
  }
};

export default AuditTrailActions;
