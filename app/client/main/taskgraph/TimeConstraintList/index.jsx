import React from 'react';
import Immutable from 'immutable';
import PropTypes from 'prop-types';

import TimeConstraintsViz from 'main/taskgraph/component/views/TimeConstraintsViz';
import { timeConstraintsForTask } from 'main/taskgraph/component/utils/TimeConstraintUtils';

import './TimeConstraintList.scss';

function TimeConstraintList({ taskId, taskGraph, refColors }) {
  const timeConstraints = timeConstraintsForTask(
    taskId,
    taskGraph
  );

  return (
    <TimeConstraintsViz timeConstraints={timeConstraints} taskGraph={taskGraph} refColors={refColors} />
  );
}

TimeConstraintList.propTypes = {
  taskId: PropTypes.string,
  taskGraph: PropTypes.instanceOf(Immutable.Map),
  refColors: PropTypes.instanceOf(Immutable.Map)
};

export default TimeConstraintList;
