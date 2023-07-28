import { inflect } from 'inflection';
import PropTypes   from 'prop-types';
import React       from 'react';

import Urls from 'main/util/urls';

import { Button } from '@transcriptic/amino';

function WaitingShipmentAlert(props) {
  return (
    <div className="alert alert-warning">
      <strong>
        {`Waiting on ${inflect('shipment', props.shipment_ids.length)}: `}
      </strong>
      {props.shipment_ids.map((s) => {
        return (
          <Button
            key={s.id}
            type="primary"
            link
            size="small"
            icon="fa fa-external-link-alt"
            href={Urls.shipment(s.id)}
          >
            <span>View Shipment</span>
          </Button>
        );
      })}
    </div>
  );
}

WaitingShipmentAlert.propTypes = {
  shipment_ids: PropTypes.instanceOf(Array)
};

export default WaitingShipmentAlert;
