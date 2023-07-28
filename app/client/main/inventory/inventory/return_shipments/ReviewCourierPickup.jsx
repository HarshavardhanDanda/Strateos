import * as Immutable from 'immutable';
import PropTypes      from 'prop-types';
import React          from 'react';

import ShipmentContainersSummary from 'main/inventory/inventory/return_shipments/ShipmentContainersSummary';
import courierCopy from 'main/inventory/inventory/return_shipments/courierCopy';

function ReviewCourierPickup({ containers, onEditContainers, courierName }) {
  return (
    <div className="vertical-spaced-list review-courier-pickup">
      <ShipmentContainersSummary
        containers={containers}
        onEditContainers={onEditContainers}
      />
      <div>
        You have selected <em>{courierName}</em> to pick up these samples.
      </div>
      <div>{courierCopy}</div>
    </div>
  );
}

ReviewCourierPickup.propTypes = {
  containers:       PropTypes.instanceOf(Immutable.Iterable).isRequired,
  onEditContainers: PropTypes.func.isRequired,
  courierName:      PropTypes.string.isRequired
};

export default ReviewCourierPickup;
