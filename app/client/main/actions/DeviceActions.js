import Dispatcher          from 'main/dispatcher';
import NotificationActions from 'main/actions/NotificationActions';
import DeviceAPI           from 'main/api/DeviceAPI';

const DeviceActions = {
  loadAll() {
    return DeviceAPI.indexAll({
      filters: {
        active_work_units: true
      }
    })
      .fail((...args) => {
        NotificationActions.handleError(...(args || []));
      });
  },

  destroy(id) {
    return DeviceAPI.destroy(id)
      .done(() => {
        Dispatcher.dispatch({ type: 'DEVICE_DESTROYED', id });
      })
      .fail((...args) => {
        NotificationActions.handleError(...(args || []));
      });
  },

  create(id, attributes) {
    return DeviceAPI.create({ id: id, attributes: attributes })
      .fail((...response) => NotificationActions.handleError(...response));
  },

  update(id, data) {
    return DeviceAPI.update(id, data)
      .fail((...response) => NotificationActions.handleError(...response));
  }
};

export default DeviceActions;
