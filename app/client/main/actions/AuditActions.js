import AuditsAPI from 'main/api/AuditsAPI';
import NotificationActions from 'main/actions/NotificationActions';

const AuditActions = {
  loadAll(options) {
    return AuditsAPI.indexAll(options)
      .fail((...args) => {
        NotificationActions.handleError(...(args || []));
      });
  }
};

export default AuditActions;
