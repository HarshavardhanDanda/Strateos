import React from 'react';
import PropTypes from 'prop-types';
import Immutable from 'immutable';
import _ from 'lodash';

import { Banner } from '@transcriptic/amino';
import { ShipmentModel } from 'main/stores/ShipmentStore';
import ShipmentsTable from './ShipmentsTable';

function ImplementationIcon(props) {
  return props.data
    ? <i className="fa fa-check" title="Implementation Shipment" />
    : false;
}

ImplementationIcon.propTypes = {
  data: PropTypes.object
};

const bannerMessage = (shipment) => {
  return `Shipment ${shipment.organizationName()}: ${shipment.label()} has been checked in.`;
};

function Shipments({
  shipments,
  shipmentToContainers,
  checkedinShipment,
  history,
  onClickBanner,
  onPageChange,
  numPages,
  page,
  onSelectFilter,
  loading,
  labs,
  onCheckin,
  showOrgFilter
}) {

  return (
    <div className="list">
      <div className="list__banner">
        {
          checkedinShipment && (
            <Banner
              bannerType="success"
              bannerMessage={bannerMessage(checkedinShipment)}
              onClose={onClickBanner}
            />
          )}
      </div>
      <div>
        <ShipmentsTable
          shipments={shipments}
          shipmentToContainers={shipmentToContainers}
          history={history}
          labs={labs}
          onPageChange={onPageChange}
          numPages={numPages}
          page={page}
          onSelectFilter={onSelectFilter}
          loading={loading}
          onCheckin={onCheckin}
          showOrgFilter={showOrgFilter}
        />
      </div>
    </div>
  );
}

Shipments.propTypes = {
  shipments: PropTypes.instanceOf(Immutable.Iterable).isRequired,
  shipmentToContainers: PropTypes.instanceOf(Immutable.Map),
  checkedinShipment: PropTypes.instanceOf(ShipmentModel),
  history: PropTypes.object,
  onClickBanner: PropTypes.func,
  onCheckin: PropTypes.func,
  showOrgFilter: PropTypes.bool
};

export default Shipments;
