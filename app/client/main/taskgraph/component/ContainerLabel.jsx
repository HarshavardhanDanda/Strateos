import TaskGraphStyle from 'main/taskgraph/component/TaskGraphStyle';
import PropTypes      from 'prop-types';
import React          from 'react';

function ContainerLabel({ label, color, onClick, disabled }) {
  const style = TaskGraphStyle.containerLabelStyle({ label, color, disabled });
  const labelToDisplay = label || 'No Name';

  if (onClick) {
    return (
      <button
        style={style}
        disabled={disabled}
        onClick={(e) => {
          e.target.blur();
          onClick(e);
        }}
      >
        {labelToDisplay}
      </button>
    );
  }

  return <div style={style}>{labelToDisplay}</div>;
}

ContainerLabel.propTypes = {
  label: PropTypes.string,
  color: PropTypes.string,
  onClick: PropTypes.func,
  disabled: PropTypes.bool
};

export default ContainerLabel;
