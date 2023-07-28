import * as dagre     from 'dagre';
import * as Immutable from 'immutable';
import PropTypes      from 'prop-types';
import React          from 'react';

import Line from 'main/taskgraph/component/views/Line';
import TaskGraphStyle from 'main/taskgraph/component/TaskGraphStyle';
import { nodeLeftCenter, nodeRightCenter } from 'main/taskgraph/component/utils/DagreUtil';

// TODO Maybe rename this to TaskGraphContainerDepEdges to distinguish from time constraint edges
function TaskGraphEdges({ dagreGraph, highlightedTaskIds }) {
  return (
    <g>
      {
        dagreGraph.edges().map((edge) => {
          const { w, v } = edge;

          const startPoint = nodeLeftCenter(dagreGraph.node(w));
          const endPoint = nodeRightCenter(dagreGraph.node(v));

          const highlighted = highlightedTaskIds.has(v) && highlightedTaskIds.has(w);

          const lineAttrs = {
            opacity: highlighted ? 1 : TaskGraphStyle.deselectedOpacity
          };

          return (
            <Line
              key={`dependency|${v}|${w}`}
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

TaskGraphEdges.propTypes = {
  dagreGraph: PropTypes.instanceOf(dagre.graphlib.Graph).isRequired,
  highlightedTaskIds: PropTypes.instanceOf(Immutable.Set).isRequired
};

export default TaskGraphEdges;
