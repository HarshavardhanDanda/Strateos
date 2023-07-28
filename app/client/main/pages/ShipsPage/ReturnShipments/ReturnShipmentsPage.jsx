import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React     from 'react';

import ReturnShipmentActions    from 'main/actions/ReturnShipmentActions';
import CourierPickupsTable      from 'main/pages/ShipsPage/ReturnShipments/CourierPickupsTable';
import ReturnShipmentsTable     from 'main/pages/ShipsPage/ReturnShipments/ReturnShipmentsTable';
import ConnectToStores          from 'main/containers/ConnectToStoresHOC';
import ReturnShipmentStore      from 'main/stores/ReturnShipmentStore';
import ImmutableUtil            from 'main/util/ImmutableUtil';

class ReturnShipmentsPane extends React.Component {

  static get propTypes() {
    return {
      allShipments: PropTypes.instanceOf(Immutable.Iterable)
    };
  }

  componentDidMount() {
    return ReturnShipmentActions.loadPending();
  }

  render() {
    const [courierShipments, returnShipments] = ImmutableUtil.partition(
      this.props.allShipments,
      shipment => shipment.get('is_courier_pickup')
    );

    return (
      <div className="return-shipments vertical-spaced-list">
        <div>
          <h2>Courier Pickups</h2>
          <Choose>
            <When condition={courierShipments.count() > 0}>
              <CourierPickupsTable returnShipments={courierShipments} />
            </When>
            <Otherwise>
              <div>No courier pickups</div>
            </Otherwise>
          </Choose>
        </div>
        <div>
          <h2>Return Shipments</h2>
          <Choose>
            <When condition={returnShipments.count() > 0}>
              <ReturnShipmentsTable returnShipments={returnShipments} />
            </When>
            <Otherwise>
              <div>No return shipments</div>
            </Otherwise>
          </Choose>
        </div>
      </div>
    );
  }
}

const getStateFromStores = function() {
  const allShipments = ReturnShipmentStore.getAll().filter(
    rs => rs.get('status') !== 'shipped'
  );

  return {
    allShipments
  };
};

export default ConnectToStores(ReturnShipmentsPane, getStateFromStores);
