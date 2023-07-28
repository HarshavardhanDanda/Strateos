import PropTypes from 'prop-types';
import React     from 'react';

import './BaseTag.scss';

function BaseTag({ backgroundColor, onClick, children }) {
  return (
    <span
      onClick={onClick}
      className="base-tag"
      style={{ backgroundColor }}
    >
      {children}
    </span>
  );
}

BaseTag.defaultProps = {
  onClick: () => {}
};

BaseTag.propTypes = {
  onClick: PropTypes.func,
  backgroundColor: PropTypes.string.isRequired,
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node
  ])
};

export default BaseTag;
