import APIActions          from 'main/util/APIActions';
import NotificationActions from 'main/actions/NotificationActions';
import Urls                from 'main/util/urls';

const resource = 'stale_containers';
const url      = Urls.stale_containers_api;

const StaleContainerActions = Object.assign(APIActions(resource, url), {
  flagForExtension(id) {
    return this.update({ id, requestedExtensionAt: Date.now() })
      .then(() =>
        NotificationActions.createNotification({
          text: 'Extension Applied'
        })
      );
  },

  flagForStaleNotifications(ids) {
    return this.updateMany(ids, { adminFlaggedForNotificationAt: Date.now() });
  },

  flagForExtensions(ids) {
    return this.updateMany(ids, { adminFlaggedForExtensionAt: Date.now() });
  }
});

export default StaleContainerActions;
