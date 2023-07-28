import Dispatcher          from 'main/dispatcher';
import NotificationActions from 'main/actions/NotificationActions';
import SupplierAPI           from 'main/api/SupplierAPI';
import SessionStore from 'main/stores/SessionStore';

const SupplierActions = {
  loadAll() {
    return SupplierAPI.indexAll()
      .fail((...args) => {
        NotificationActions.handleError(...(args || []));
      });
  },

  create(name) {
    const organizationId = SessionStore.getOrg().get('id');
    return SupplierAPI.create({ attributes: { name: name, organization_id: organizationId } })
      .fail((...args) => {
        NotificationActions.handleError(...(args || []));
      });
  },

  destroy(id) {
    return SupplierAPI.destroy(id)
      .done(() => {
        Dispatcher.dispatch({ type: 'SUPPLIER_DESTROYED', id });
      })
      .fail((...args) => {
        NotificationActions.handleError(...(args || []));
      });
  },

  search(options) {
    return SupplierAPI.index(options)
      .fail((...args) => {
        NotificationActions.handleError(...(args || []));
      });
  }
};

export default SupplierActions;
