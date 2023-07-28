// this will soon import from the library
import AddressUI from 'main/components/addressLib/index';

import AddressStore from 'main/stores/AddressStore';
import AddressActions from 'main/actions/AddressActions';

// exports AddressCreator, AddressSelector, AddressText
export default AddressUI({
  getAllAddresses: AddressStore.getAll.bind(AddressStore),
  loadAllAddresses: AddressActions.loadAll,
  createAddress: AddressActions.create,
  updateAddress: AddressActions.update
});
