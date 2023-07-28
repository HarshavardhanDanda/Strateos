import React from 'react';
import PropTypes from 'prop-types';
import BaseTag from 'main/components/InstructionTags/BaseTag';

import './WellTag.scss';

class LabelTag extends React.Component {

  render() {
    const { containerId, label, color } = this.props;
    return (
      <BaseTag
        backgroundColor={color}
        onClick={(e) => {
          if (this.context.onNavigateContainer) {
            this.context.onNavigateContainer(containerId);
          }
          e.stopPropagation();
        }}
      >
        <span className="well-tag">
          <span className="well-tag__refname">
            {label || containerId}
          </span>
        </span>
      </BaseTag>
    );
  }
}

LabelTag.contextTypes = {
  onNavigateContainer: PropTypes.func
};

LabelTag.propTypes = {
  containerId: PropTypes.string.isRequired,
  label: PropTypes.string,
  color: PropTypes.string.isRequired
};

export default LabelTag;
