import React from 'react';
import * as Immutable from 'immutable';
import * as dagre from 'dagre';
import PropTypes from 'prop-types';

import Line from 'main/taskgraph/component/views/Line';
import TaskGraphStyle from 'main/taskgraph/component/TaskGraphStyle';
import { nodeLeftCenter, nodeRightCenter } from 'main/taskgraph/component/utils/DagreUtil';

// TODO This should be in ./models
const constraintTaskId = (constraint) => {
  return (fromOrTo) => {
    return constraint.get(fromOrTo).valueSeq().first();
  };
};

function TimeConstraintEdges({ dagreGraph, timeConstraints, highlightedTaskIds }) {
  return (
    <g>
      {
        timeConstraints.map((constraint, index) => {
          const getTaskId = constraintTaskId(constraint);

          const fromId = getTaskId('from');
          const toId   = getTaskId('to');
          const highlighted = highlightedTaskIds.has(fromId) && highlightedTaskIds.has(toId);

          const startPoint = nodeLeftCenter(dagreGraph.node(fromId));
          const endPoint = nodeRightCenter(dagreGraph.node(toId));

          const lineAttrs = {
            opacity: highlighted ? 1 : TaskGraphStyle.deselectedOpacity,
            strokeWidth: 3,
            strokeDasharray: TaskGraphStyle.constraintDasharray
          };

          return (
            <Line
              key={`constraint|${fromId}||${toId}||${index}`}
              p1={startPoint}
              p2={endPoint}
              attrs={lineAttrs}
            />
          );
        })
      }
    </g>
  );
}

TimeConstraintEdges.propTypes = {
  dagreGraph: PropTypes.instanceOf(dagre.graphlib.Graph).isRequired,
  timeConstraints: PropTypes.instanceOf(Immutable.Iterable).isRequired,
  highlightedTaskIds: PropTypes.instanceOf(Immutable.Set).isRequired
};

export default TimeConstraintEdges;
