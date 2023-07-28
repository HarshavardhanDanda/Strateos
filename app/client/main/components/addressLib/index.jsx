import React from 'react';

import connectToStoresHOC from 'main/containers/ConnectToStoresHOC';

import AddressCreator from './addressCreator';
import AddressSelector from './addressSelector';
import AddressText from './addressText';

function addressCreatorHOC(createAddress, updateAddress) {
  return React.forwardRef((props, ref) => {
    const newProps = { createAddress, updateAddress, ...props };
    return <AddressCreator ref={ref} {...newProps} />;
  });
}

function addressSelectorHOC(loadAllAddresses, createAddress) {
  return function(props) {
    const newProps = { loadAllAddresses, createAddress, ...props };
    return <AddressSelector {...newProps} />;
  };
}

export default ({ getAllAddresses, loadAllAddresses, createAddress, updateAddress }) => {
  return {
    AddressCreator: addressCreatorHOC(createAddress, updateAddress),
    AddressSelector: connectToStoresHOC(addressSelectorHOC(loadAllAddresses, createAddress),
      () => ({ addresses: getAllAddresses() })),
    AddressText
  };
};
