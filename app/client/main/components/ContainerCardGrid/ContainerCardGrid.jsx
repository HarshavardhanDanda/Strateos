import React from 'react';
import PropTypes from 'prop-types';
import { Link }  from 'react-router-dom';
import Immutable from 'immutable';
import FeatureConstants  from '@strateos/features';
import FeatureStore      from 'main/stores/FeatureStore';
import Urls              from 'main/util/urls';
import { ContainerCard } from 'main/components/ContainerCard';

import './ContainerCardGrid.scss';

function ContainerCardGrid(props) {
  return (
    <div className="container-card-grid">
      {props.containers.map((container) => {
        const id = container.get('id');
        return (
          <div className="container-card-grid__grid-item" key={id}>
            <div
              className="container-card-wrapper"
              onClick={props.onDismiss}
            >
              {FeatureStore.hasFeature(FeatureConstants.VIEW_SAMPLE_CONTAINERS) ? (
                <Link to={Urls.container(container.get('id'))}>
                  <ContainerCard
                    container={container}
                    shipment={props.shipment}
                    overlayDisabled
                    showShipmentCode={props.showShipmentCode}
                    shipmentLabelDisabled={props.shipmentLabelDisabled}
                    justCreated={props.justCreated}
                  />
                </Link>
              ) : (
                <ContainerCard
                  container={container}
                  shipment={props.shipment}
                  overlayDisabled
                  showShipmentCode={props.showShipmentCode}
                  shipmentLabelDisabled={props.shipmentLabelDisabled}
                  justCreated={props.justCreated}
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

ContainerCardGrid.propTypes = {
  containers: PropTypes.instanceOf(Immutable.Map),
  shipment: PropTypes.instanceOf(Immutable.Map),
  onDismiss: PropTypes.func,
  showShipmentCode: PropTypes.bool,
  shipmentLabelDisabled: PropTypes.bool,
  justCreated: PropTypes.bool
};

export default ContainerCardGrid;
