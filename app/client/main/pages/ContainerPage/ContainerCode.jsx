import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React     from 'react';
import { Icon } from '@transcriptic/amino';

import './ContainerCode.scss';

function ContainerCode({ container, containerType }) {
  return (
    <div className="container-code">
      {containerType && (
        <Icon
          icon={containerType.get('is_tube') ? 'aminor-tube' : 'aminor-plate'}
          size="large"
        />
      )}
      {container.get('shipment_code') && (
        <h4 className="tx-type--invert">{container.get('shipment_code')}</h4>
      )}
    </div>
  );
}

ContainerCode.propTypes = {
  container: PropTypes.instanceOf(Immutable.Map).isRequired,
  containerType: PropTypes.instanceOf(Immutable.Map)
};

export default ContainerCode;
