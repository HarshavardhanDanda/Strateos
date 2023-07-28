import React from 'react';
import PropTypes from 'prop-types';

function deviceScale() {
  return window.devicePixelRatio || 1;
}

function Surface(props) {
  const scale = deviceScale();
  return (
    <canvas
      ref={(node) => {
        if (!node) {
          return;
        }
        props.onGetNode(node, deviceScale());
      }}
      width={props.width * scale}
      height={props.height * scale}
      style={{ width: props.width, height: props.height }}
    />
  );
}

Surface.propTypes = {
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  onGetNode: PropTypes.func.isRequired
};

export default Surface;
