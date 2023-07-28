import React from 'react';
import PropTypes from 'prop-types';

import './PlateAndInfo.scss';

function PlateAndInfo(props) {
  return (
    <div className="plate-and-info">
      <div className="plate-and-info__plate">
        {props.plate}
      </div>
      <If condition={props.info}>
        <div className="plate-and-info__info">
          {props.info}
        </div>
      </If>
    </div>
  );
}

PlateAndInfo.propTypes = {
  plate: PropTypes.node,
  info: PropTypes.node
};

export default PlateAndInfo;
