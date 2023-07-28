import AdminUrls  from 'main/admin/urls';
import APIActions from 'main/util/APIActions';
import Dispatcher from 'main/dispatcher';
import ajax       from 'main/util/ajax';
import NotificationActions from 'main/actions/NotificationActions';

const resource = 'organization';
const url      = AdminUrls.organizations;

const AdminOrganizationActions = APIActions(resource, url);

const OrganizationActions = {
  destroy(org) {
    const orgId = org.id;
    const orgName = org.name.name;
    return ajax.delete(`/admin/organizations/${orgId}`)
      .done(() => {
        NotificationActions.createNotification({
          text: 'organization is deleted'
        });
        Dispatcher.dispatch({ type: 'ORGANIZATION_DESTROYED', orgId });
      })
      .fail(() => {
        NotificationActions.createNotification({
          text: `Cannot delete the organization - ${orgName}`,
          isError: true
        });
      });
  }
};

// This is necessary because the search route is not under the admin/organizations/ route
const search = APIActions(resource, () => AdminUrls.customers()).search;

export default Object.assign(AdminOrganizationActions, OrganizationActions, { search });
