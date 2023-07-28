/* eslint-bisable camelcase */
import AdminUrls           from 'main/admin/urls';
import Dispatcher          from 'main/dispatcher';
import NotificationActions from 'main/actions/NotificationActions';
import ajax                from 'main/util/ajax';

const ImplementationItemActions = {
  create(data, shipmentId) {
    return ajax.post(
      AdminUrls.implementation_items(), { implementation_item: data, shipment_id: shipmentId }
    ).done((implementationItem) => {
      Dispatcher.dispatch({ type: 'IMPLEMENTATION_ITEM_DATA', implementationItem });
    }).fail((...args) => NotificationActions.handleError(...args));
  },

  // data should be a plain JS Object
  update(id, data) {
    return ajax.patch(AdminUrls.implementation_item(id), { implementation_item: data })
      .done((implementationItem) => {
        Dispatcher.dispatch({ type: 'IMPLEMENTATION_ITEM_DATA', implementationItem });
      })
      .fail((...args) => NotificationActions.handleError(...args));
  },

  destroy(id) {
    return ajax.delete(AdminUrls.implementation_item(id))
      .done(() => {
        Dispatcher.dispatch({ type: 'IMPLEMENTATION_ITEM_DESTROYED', id });
      })
      .fail((...args) => NotificationActions.handleError(...args));
  },

  loadAll(shipmentId) {
    return ajax.get(AdminUrls.implementation_items(), { shipment_id: shipmentId })
      .done((implementationItems) => {
        Dispatcher.dispatch({ type: 'IMPLEMENTATION_ITEM_LIST', implementationItems });
      })
      .fail((...args) => NotificationActions.handleError(...args));
  }
};

export default ImplementationItemActions;
