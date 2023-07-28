import APIActions from 'main/util/APIActions';
import Urls       from 'main/util/urls';

const resource = 'support_ticket';

const SupportTicketActions = {
  create(projectId, runId, formData) {
    const url = () => Urls.support_tickets(projectId, runId);
    return APIActions(resource, url).create(formData);
  },
  loadAll(projectId, runId) {
    const url = () => Urls.support_tickets(projectId, runId);
    return APIActions(resource, url).loadAll();
  }
};

export default SupportTicketActions;
