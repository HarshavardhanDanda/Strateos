import { Popover, TrackingNumber, DateTime } from '@transcriptic/amino';
import Immutable                   from 'immutable';
import PropTypes                   from 'prop-types';
import React                       from 'react';

import Urls           from 'main/util/urls';
import AddressText    from 'main/components/addressLib/addressText';

import './ReturnShipmentCard.scss';

const containerCardPropTypes = {
  container: PropTypes.shape({
    is_tube: PropTypes.bool.isRequired,
    label:   PropTypes.string,
    id:      PropTypes.string,
    barcode: PropTypes.string
  })
};

function ContainerCard({ container }) {
  const iconUrl = (isTube) => {
    const icon = isTube ? 'tube' : 'plate';
    const url  = `/images/icons/inventory_browser_icons/${icon}-icon.svg`;

    return url;
  };

  return (
    <div className="return-shipment-container-card">
      <div className="return-shipment-container-card__icon">
        <img src={iconUrl(container.is_tube)} alt={container.label} />
      </div>
      <div>
        <a href={Urls.container(container.id)}>
          {container.label || container.id}
        </a>
        <p>{container.barcode}</p>
      </div>
    </div>
  );
}

ContainerCard.propTypes = containerCardPropTypes;

const returnShipmentPropTypes = {
  returnShipment:    PropTypes.shape({
    id:              PropTypes.string.isRequired,
    created_at:      PropTypes.string.isRequired,
    temp:            PropTypes.string.isRequired,
    address:         PropTypes.object,
    tracking_number: PropTypes.string,
    carrier:         PropTypes.string,
    containers:      PropTypes.arrayOf(PropTypes.object),
    delivery_date:   PropTypes.string,
    is_courier_pickup: PropTypes.bool
  })
};

function ReturnShipmentCard({ returnShipment }) {
  const {
    id,
    created_at,
    temp,
    address,
    tracking_number,
    carrier,
    containers,
    delivery_date,
    is_courier_pickup
  } = returnShipment;

  const status = (() => {
    if (delivery_date) {
      return is_courier_pickup ? 'Picked Up' : 'delivered';
    }
    return returnShipment.status;
  })();

  const deliveryDateTime = () => {
    return <DateTime timestamp={(delivery_date)} />;
  };

  const getDeliveryStatusInfo = () => {
    if (status === 'Picked Up') return `Your return shipment has been picked up by ${carrier}.`;
    if (status === 'delivered') return 'Your return shipment has been delivered.';
    return `Your return shipment has been ${status}.`;
  };

  // We have some addresses that have been deleted. This prevents
  // us from stating where we shipped to. We need to fix this
  const shippedTo = address ? address.attention : 'Unknown';
  return (
    <div className="return-shipment-card">
      <div className="return-shipment-card__head">
        <div className="return-shipment-card__info">
          <p className="return-shipment-card__label">return placed</p>
          <span><DateTime timestamp={(created_at)} /></span>
        </div>
        <div className="return-shipment-card__info">
          <p className="return-shipment-card__label">temperature</p>
          <span>{temp || '-' }</span>
        </div>
        <div className="return-shipment-card__info">
          <p className="return-shipment-card__label">ship to</p>
          <Popover
            disabled={shippedTo === 'Unknown'}
            placement="bottom"
            content={address ? <AddressText address={Immutable.fromJS(address)} /> : undefined}
          >
            <a disabled={shippedTo === 'Unknown'}>{shippedTo}</a>
          </Popover>
        </div>
        <div className="return-shipment-card__info pull-right">
          <p className="return-shipment-card__label">return # {id}</p>
          <TrackingNumber trackingNumber={tracking_number} carrier={carrier} />
        </div>
      </div>
      <div className="return-shipment-card__body">
        <h3 className="return-shipment-card__status-title">
          {status} {(status === 'delivered') && deliveryDateTime()}
        </h3>
        <p>{getDeliveryStatusInfo()}</p>
        {containers.map(c => <ContainerCard key={c.id} container={c} />)}
      </div>
    </div>
  );
}

ReturnShipmentCard.propTypes = returnShipmentPropTypes;

export default ReturnShipmentCard;
