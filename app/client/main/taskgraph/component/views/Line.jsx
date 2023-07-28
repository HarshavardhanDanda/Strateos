import React from 'react';
import PropTypes from 'prop-types';

import TaskGraphStyle from 'main/taskgraph/component/TaskGraphStyle';

const { lineDefaultColor } = TaskGraphStyle;

const defaultAttrs = {
  stroke: lineDefaultColor,
  strokeWidth: 1,
  opacity: 1
};

function Line({ p1, p2, attrs = {} }) {
  return (
    <line
      x1={p1.x}
      x2={p2.x}
      y1={p1.y}
      y2={p2.y}
      {...defaultAttrs}
      {...attrs}
    />
  );
}

const pointShape = PropTypes.shape({
  x: PropTypes.number.isRequired,
  y: PropTypes.number.isRequired
});

Line.propTypes = {
  p1: pointShape.isRequired,
  p2: pointShape.isRequired,
  attrs: PropTypes.instanceOf(Object)
};

export default Line;
