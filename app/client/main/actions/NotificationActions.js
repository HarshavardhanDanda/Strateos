import Dispatcher from 'main/dispatcher';
import * as Errors from 'main/util/ajax/Errors/Errors';
import { pubSub } from '@strateos/micro-apps-utils';

const TIMEOUT = 5 * 1000;

const NotificationActions = {
  counter: 0,

  handleError(xhr, status, text) {
    Errors.fromXHR(xhr, status, text).forEach(errText =>
      this.createNotification({
        text: errText,
        isError: true,
        timeout: TIMEOUT
      })
    );
  },

  // for non-errors: setting timeout to zero means notification must be manually
  // dismissed, default is 5 seconds
  // for errors: default is no timeout, but can be overriden by explicitly
  // setting a timeout
  createNotification({ text, actionText, actionCallback, timeout, isError, isSuccess, icon, isInfo, title }) {
    const wait = timeout || TIMEOUT;

    const notification = {
      id: (this.counter += 1).toString(), // All ids are stored as strings in CRUDStore
      text,
      actionText,
      actionCallback,
      isError,
      isSuccess,
      isInfo,
      icon,
      title
    };
    notification.dismiss = () => this.dismissNotification(notification);
    notification.timeout = setTimeout(this.dismissNotification.bind(this, notification), wait);

    Dispatcher.dispatch({
      type: 'NOTIFICATION_SHOW',
      notification
    });
  },

  dismissNotification(notification) {
    if (notification.timeout) {
      clearTimeout(notification.timeout);
    }
    Dispatcher.dispatch({
      type: 'NOTIFICATION_DISMISS',
      id: notification.id
    });
  }
};

// Subscribe to notfications sent by micro-apps
pubSub.subscribe('NOTIFICATION_SHOW', (notification) => NotificationActions.createNotification(notification));

export default NotificationActions;
