import PropTypes from 'prop-types';
import React     from 'react';

import TaskGraphStyle from 'main/taskgraph/component/TaskGraphStyle';

function NodeTitle({ title }) {
  return <div style={TaskGraphStyle.nodeTitleStyle}>{title}</div>;
}

NodeTitle.propTypes = {
  title: PropTypes.string.isRequired
};

export default NodeTitle;
