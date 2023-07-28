import Dispatcher from 'main/dispatcher';
import NotificationActions from 'main/actions/NotificationActions';
import VendorAPI from 'main/api/VendorAPI';

const VendorActions = {
  loadAll() {
    return VendorAPI.indexAll()
      .fail((...args) => {
        NotificationActions.handleError(...(args || []));
      });
  },

  getVendorsList() {
    return VendorAPI.getCommercialVendors()
      .fail((...response) => NotificationActions.handleError(...response));
  },

  create(name) {
    return VendorAPI.create({ attributes: { name: name } })
      .fail((...args) => {
        NotificationActions.handleError(...(args || []));
      });
  },

  destroy(id) {
    return VendorAPI.destroy(id)
      .done(() => {
        Dispatcher.dispatch({ type: 'VENDOR_DESTROYED', id });
      })
      .fail((...args) => {
        NotificationActions.createNotification({ text: args[0].responseJSON.errors[0].title, isError: true });
      });
  }
};

export default VendorActions;
