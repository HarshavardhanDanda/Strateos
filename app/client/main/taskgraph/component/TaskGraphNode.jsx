import * as Immutable from 'immutable';
import PropTypes      from 'prop-types';
import React          from 'react';

import NodeTitle from 'main/taskgraph/component/nodes/NodeTitle';
import InstructionTaskNode from 'main/taskgraph/component/nodes/InstructionTaskNode';
import FetchTaskNode from 'main/taskgraph/component/nodes/FetchTaskNode';
import DestinyTaskNode from 'main/taskgraph/component/nodes/DestinyTaskNode';
import SupplyTaskNode from 'main/taskgraph/component/nodes/SupplyTaskNode';
import TaskGraphStyle from 'main/taskgraph/component/TaskGraphStyle';

// This is simply a helper utility for rendering the right type of task graph
// node component based on the node type string -- 'InstructionTask', 'FetchTask', etc..
function TaskGraphNode(props) {
  const taskType = props.task.get('name');
  switch (taskType) {
    case 'InstructionTask':
      return <InstructionTaskNode {...props} />;
    case 'FetchTask':
      return <FetchTaskNode {...props} />;
    case 'DestinyTask':
      return <DestinyTaskNode {...props} />;
    case 'SupplyTask':
      return <SupplyTaskNode {...props} />;
    default:
      console.error('Unknown task type encountered: ', taskType);
      return (
        <div style={TaskGraphStyle.nodeContainerStyle(100, 50, 1)}>
          <NodeTitle title={'Unknown Task Type'} />
        </div>
      );
  }
}

TaskGraphNode.propTypes = {
  task: PropTypes.instanceOf(Immutable.Map).isRequired
};

export default TaskGraphNode;
