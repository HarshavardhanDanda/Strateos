import React from 'react';
import Immutable from 'immutable';
import PropTypes from 'prop-types';

import { Card } from '@transcriptic/amino';

import AddressEnvelope   from 'main/inventory/components/AddressEnvelope';

import './ShippingInstructions.scss';

function ShippingInstructions(props) {
  const { labOperatorName } = props;
  return (
    <Card container className="shipping-instructions">
      <h4>Shipping Instructions</h4>
      <div className="shipping-instructions__instruction">
        <li className="shipping-instructions__instruction-header list-unstyled">
          1. Aliquot to {labOperatorName} Containers
        </li>
        <p className="desc tx-type--primary">
          Clearly label each container using the 3-letter code provided (no need for the full sample name).
        </p>
        <div className="card-intake-code-focus" />
      </div>
      <div className="shipping-instructions__instruction">
        <li className="shipping-instructions__instruction-header list-unstyled">
          2. Ship Containers to {labOperatorName}
        </li>
        <p className="desc tx-type--primary">
          Please write your corresponding 4-letter intake code on your
          package and ship it to:
        </p>
        <AddressEnvelope
          intakeCode={props.shipment.get('label')}
          labOperatorName={labOperatorName}
          address={props.address}
        />
      </div>
    </Card>
  );
}

ShippingInstructions.defaultProps = {
  labOperatorName: 'Strateos'
};

ShippingInstructions.propTypes = {
  shipment: PropTypes.instanceOf(Immutable.Map).isRequired,
  labOperatorName: PropTypes.string.isRequired,
  address: PropTypes.instanceOf(Immutable.Map)
};

export default ShippingInstructions;
