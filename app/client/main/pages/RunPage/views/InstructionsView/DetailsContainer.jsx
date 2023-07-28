import PropTypes from 'prop-types';
import React     from 'react';

import { Button } from '@transcriptic/amino';

import './DetailsContainer.scss';

function DetailsContainer(props) {
  return (
    <div className="details-container">
      <div className="details-container__button-wrapper">
        <Button
          onClick={props.onClose}
          type="secondary"
          size="medium"
          icon="fa-times"
          label="Close"
        />
      </div>

      {props.children}
    </div>
  );
}

DetailsContainer.propTypes = {
  onClose: PropTypes.func,
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node
  ]).isRequired
};

export default DetailsContainer;
