import PropTypes from 'prop-types';
import React     from 'react';

const propTypes = {
  containerTypeId: PropTypes.string.isRequired
};

function ContainerType({ containerTypeId }) {
  return (
    containerTypeId ? (
      <a
        href={`/container_types#${containerTypeId}`}
        target="_blank"
        rel="noopener noreferrer"
      >{containerTypeId}
      </a>
    ) : <a>Unknown</a>
  );
}

ContainerType.propTypes = propTypes;

export default ContainerType;
