import classnames from 'classnames';
import PropTypes  from 'prop-types';
import React      from 'react';

import { Tooltip } from '@transcriptic/amino';

import './PlateViewTypeToggle.scss';

function Icon(props) {
  return (
    <div
      className={classnames(
        'plate-view-type-toggle__plate-icon',
        {
          'plate-view-type-toggle--plate': props.isPlate,
          'plate-view-type-toggle--map': !props.isPlate,
          'plate-view-type-toggle--active': props.isActive
        }
      )}
      onClick={props.onClick}
    >
      {
        [...Array(6).keys()].map((i) => {
          return <span key={i} className="plate-view-type-toggle__well" />;
        })
      }
    </div>
  );
}

Icon.propTypes = {
  isPlate: PropTypes.bool,
  isActive: PropTypes.bool,
  onClick: PropTypes.func.isRequired
};

function PlateViewTypeToggle(props) {
  return (
    <div className="plate-view-type-toggle tx-inline">
      <Tooltip
        title="View As Plate"
        placement="bottom"
        className="tx-inline__item tx-inline__item--xxs"
      >
        <Icon
          isPlate
          isActive={props.activeView === 'plate'}
          onClick={() => { props.setView('plate'); }}
        />
      </Tooltip>
      <Tooltip
        title="View As Heat Map"
        placement="bottom"
      >
        <Icon
          isActive={props.activeView === 'map'}
          onClick={() => { props.setView('map'); }}
        />
      </Tooltip>
    </div>
  );
}

PlateViewTypeToggle.propTypes = {
  activeView: PropTypes.string.isRequired,
  setView: PropTypes.func.isRequired
};

export default PlateViewTypeToggle;
