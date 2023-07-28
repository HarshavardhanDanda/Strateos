import PropTypes from 'prop-types';
import React     from 'react';

import { ControlledZoomPan } from '@transcriptic/amino';

import './ZoomableDataset.scss';

function ZoomableDataset(props) {
  return (
    <div className="zoomable-dataset">
      <div className="zoomable-dataset__dataset-container">
        <ControlledZoomPan minScale={1} showControls>
          {props.children}
        </ControlledZoomPan>
      </div>
      <div className="zoomable-dataset__link-container">
        {props.link}
      </div>
    </div>
  );
}

ZoomableDataset.propTypes = {
  children: PropTypes.oneOfType([PropTypes.node, PropTypes.arrayOf(PropTypes.node)]),
  link: PropTypes.oneOfType([PropTypes.node, PropTypes.arrayOf(PropTypes.node)])
};

export default ZoomableDataset;
