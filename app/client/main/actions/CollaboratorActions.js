import Dispatcher from 'main/dispatcher';
import HTTPUtil   from 'main/util/HTTPUtil';
import ajax       from 'main/util/ajax';
import Urls       from 'main/util/urls';
import NotificationActions from 'main/actions/NotificationActions';

const CollaboratorActions = {
  loadAll(options) {
    return HTTPUtil.get(Urls.collaborators(), { options })
      .done(collaborators => Dispatcher.dispatch({ type: 'COLLABORATOR_LIST', collaborators }));
  },

  loadBySubdomain(subdomain, options) {
    const data = { subdomain, flat_json: true };
    return HTTPUtil.get(Urls.collaborators(), { data, options })
      .done(collaborators => Dispatcher.dispatch({ type: 'COLLABORATOR_LIST', collaborators }));
  },

  loadOrganizationCollaborators(orgId, options) {
    const data = { org_id: orgId, flat_json: true };
    return HTTPUtil.get(Urls.collaborators(), { data, options })
      .done(collaborators => Dispatcher.dispatch({ type: 'COLLABORATOR_LIST', collaborators }));
  },

  loadOrganizationCollaboratorsForUser(userId, options) {
    const data = { user_id: userId, flat_json: true };
    return HTTPUtil.get(Urls.collaborators(), { data, options })
      .done(collaborators => Dispatcher.dispatch({ type: 'COLLABORATOR_LIST', collaborators }));
  },

  create(name, email, featureGroupId, labId, subdomain = undefined, orgId = undefined) {
    const url = subdomain ? Urls.create_collaborator(subdomain, orgId) : Urls.collaborators();
    return ajax.post(url, { collaborator: { name, email }, permission: { featureGroupId, labId } })
      .done((collaborator) => {
        NotificationActions.createNotification({ text: 'Invitation Sent' });
        Dispatcher.dispatch({ type: 'COLLABORATOR_DATA', collaborator });
      });
  },

  destroy(collaborating_id, permission_id, destroy_collaborator, subdomain = undefined, orgId = undefined) {

    const url = subdomain ? Urls.destroy_collaborator(subdomain, collaborating_id, orgId) : Urls.collaborator(collaborating_id);
    return ajax.delete(url, { permission_id, destroy_collaborator, collaborating_id })
      .done(() => {
        destroy_collaborator && Dispatcher.dispatch({ type: 'COLLABORATOR_DESTROYED', collaborating_id });
      });
  },

  removeCollaboratorsForUser(collaborating_id, org_ids = []) {
    return ajax.post(Urls.remove_collaborators(), { collaborating_id, org_ids })
      .done(() => {
        NotificationActions.createNotification({ text: 'Successfully removed Collaborators' });
      }).fail((...response) => NotificationActions.handleError(...response));
  }
};

export default CollaboratorActions;
