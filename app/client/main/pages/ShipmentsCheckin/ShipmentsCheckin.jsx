import React from 'react';
import Immutable from 'immutable';
import PropTypes from 'prop-types';

import Urls from 'main/util/urls';
import { ShipmentModel } from 'main/stores/ShipmentStore';

import Shipments from './Shipments';
import Containers from './Containers';

class ShipmentsCheckin extends React.Component {
  static get propTypes() {
    return {
      selectedShipment: PropTypes.instanceOf(ShipmentModel),
      shipmentToContainers: PropTypes.instanceOf(Immutable.Map),
      shipments: PropTypes.instanceOf(Immutable.Iterable),
      loading: PropTypes.bool,
      history: PropTypes.object,
      loadShipments: PropTypes.func,
      showOrgFilter: PropTypes.bool
    };
  }

  constructor(props) {
    super(props);

    this.state = {
      checkedinShipment: undefined
    };
  }

  onCheckedin(checkedinShipment) {
    const { history } = this.props;

    this.setState({ checkedinShipment });
    history.push(Urls.lab_check_in());
  }

  resetCheckedinShipment() {
    this.setState({ checkedinShipment: undefined });
  }

  render() {
    const {
      shipments,
      shipmentToContainers,
      selectedShipment,
      loading,
      history,
      onPageChange,
      numPages,
      page,
      onSelectFilter,
      showOrgFilter
    } = this.props;

    const { checkedinShipment } = this.state;

    if (selectedShipment && selectedShipment.type() === 'sample') {
      return (
        <Containers
          shipment={selectedShipment}
          afterCheckedIn={shipment => this.onCheckedin(shipment)}
        />
      );
    }

    return (
      <Shipments
        shipments={shipments}
        shipmentToContainers={shipmentToContainers}
        checkedinShipment={checkedinShipment}
        history={history}
        onClickBanner={() => this.resetCheckedinShipment()}
        labs={this.props.labs}
        onPageChange={onPageChange}
        numPages={numPages}
        page={page}
        onSelectFilter={onSelectFilter}
        loading={loading}
        onCheckin={this.props.loadShipments}
        showOrgFilter={showOrgFilter}
      />
    );
  }
}

export default ShipmentsCheckin;
