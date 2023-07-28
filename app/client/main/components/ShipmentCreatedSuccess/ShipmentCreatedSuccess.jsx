import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React     from 'react';

import { Button, Divider } from '@transcriptic/amino';
import ContainerCardGrid   from 'main/components/ContainerCardGrid';

import './ShipmentCreatedSuccess.scss';

function ShipmentCreatedSuccess(props) {
  return (
    <div className="shipment-created-success">
      <div className="row">
        <div className="col-xs-12 col-sm-8 col-sm-offset-2 shipment-created-success__header-message">
          <img
            alt=""
            className="shipment-created-success__success-check tx-stack__block tx-stack__block--xxs"
            src="/images/icons/inventory_browser_icons/success-check.svg"
          />
          <h2 className="tx-stack__block tx-stack__block--xxs">
            {props.headerMessage}
          </h2>
        </div>
      </div>
      <div className="shipment-created-success__lower-content">
        <div className="row">
          <div
            className="col-xs-12 col-sm-4 col-sm-offset-4 shipment-created-success__instructions tx-stack tx-stack--sm"
          >
            {props.instructionContent}
            <Button
              type="primary"
              size="large"
              onClick={() => {
                if (props.onOkClicked) props.onOkClicked();
                if (props.onDismiss) props.onDismiss();
              }}
            >
              Ok, got it
            </Button>
          </div>
        </div>
        <Divider />
        <div className="row">
          <div className="col-xs-12 shipment-created-success__new-samples">
            <h4>New Samples</h4>
            <ContainerCardGrid
              containers={props.containers}
              onDismiss={props.onDismiss}
              shipment={props.shipment}
              showShipmentCode
              shipmentLabelDisabled
            />
          </div>
        </div>
      </div>
    </div>
  );
}

ShipmentCreatedSuccess.defaultProps = {
  headerMessage: 'Thanks for adding new samples to your Inventory.  Please ship them to us.'
};

ShipmentCreatedSuccess.propTypes = {
  containers: PropTypes.instanceOf(Immutable.Iterable).isRequired,
  onOkClicked: PropTypes.func,
  onDismiss: PropTypes.func,
  shipment: PropTypes.instanceOf(Immutable.Map),
  headerMessage: PropTypes.string,
  instructionContent: PropTypes.node
};

export default ShipmentCreatedSuccess;
