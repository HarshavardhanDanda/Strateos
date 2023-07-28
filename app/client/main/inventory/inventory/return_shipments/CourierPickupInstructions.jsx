import PropTypes from 'prop-types';
import React     from 'react';

function CourierPickupInstructions({ courierName, trackingNumber }) {
  return (
    <div className="courier-pickup-instructions">
      <div className="courier-pickup-instructions__courier-info">
        <h2>
          Have your courier <span className="tx-type--heavy">{courierName}</span> present the
          tracking number <span className="tx-type--heavy">{trackingNumber}</span> for verification at Transcriptic.
        </h2>
      </div>
    </div>
  );
}

CourierPickupInstructions.propTypes = {
  courierName:      PropTypes.string.isRequired,
  trackingNumber:   PropTypes.string.isRequired
};

export default CourierPickupInstructions;
