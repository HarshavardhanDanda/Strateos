import Dispatcher          from 'main/dispatcher';
import ajax                from 'main/util/ajax';
import NotificationActions from 'main/actions/NotificationActions';
import Urls                from 'main/util/urls';

const AddressActions = {
  loadAll(customerOrgId = undefined, customerSubdomain = undefined) {
    const url = customerOrgId ? Urls.org_addresses_api(customerOrgId, customerSubdomain) : Urls.addresses();
    return ajax.get(url)
      .done(addresses => Dispatcher.dispatch({ type: 'ADDRESS_LIST', addresses }));
  },

  create(address, customerOrgId = undefined, customerSubdomain = undefined) {
    const url = customerOrgId ? Urls.org_addresses_api(customerOrgId, customerSubdomain) :
      Urls.addresses();
    return ajax.post(url, { address })
      .done((data) => {
        Dispatcher.dispatch({ type: 'ADDRESS_DATA', address: data });
      })
      .fail((...response) => NotificationActions.handleError(...response));
  },

  update(id, address, customerOrgId = undefined, customerSubdomain = undefined) {
    const url = customerOrgId ? Urls.org_address_api(id, customerOrgId, customerSubdomain) : Urls.address(id);
    return ajax.put(url, { address })
      .done((data) => {
        Dispatcher.dispatch({ type: 'ADDRESS_DATA', address: data });
        if (id !== data.id) {
          Dispatcher.dispatch({ type: 'ADDRESS_DESTROYED', id });
        }
      })
      .fail((...response) => NotificationActions.handleError(...response));
  },

  destroy(id, customerOrgId = undefined, customerSubdomain = undefined) {
    const url = customerSubdomain ? Urls.org_address_api(id, customerOrgId, customerSubdomain) : Urls.address(id);
    return ajax.delete(url)
      .done(() => {
        Dispatcher.dispatch({ type: 'ADDRESS_DESTROYED', id });
      })
      .fail((...response) => NotificationActions.handleError(...response));
  }
};

export default AddressActions;
