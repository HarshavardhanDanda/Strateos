import * as Immutable from 'immutable';
import PropTypes      from 'prop-types';
import React          from 'react';

function AddressText(props) {
  return (
    <div className="address-text">
      <p className="attention">
        {props.address.get('attention', '')}
      </p>
      <p className="street1">
        {props.address.get('street')}
      </p>
      <p className="street2">
        {props.address.get('street_2', '')}
      </p>
      <p className="region">
        {props.address.get('city')}, {props.address.get('state')} {props.address.get('zipcode')}
      </p>
      <p className="country">
        {props.address.get('country', '')}
      </p>
    </div>
  );
}

AddressText.propTypes = {
  address: PropTypes.instanceOf(Immutable.Map).isRequired
};

export default AddressText;
