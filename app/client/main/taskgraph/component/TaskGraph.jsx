import * as dagre     from 'dagre';
import * as Immutable from 'immutable';
import PropTypes      from 'prop-types';
import React          from 'react';

import TaskGraphEdges      from 'main/taskgraph/component/TaskGraphEdges';
import TimeConstraintEdges from 'main/taskgraph/component/views/TimeConstraintEdges';
import TaskGraphNode       from 'main/taskgraph/component/TaskGraphNode';

import './TaskGraph.scss';

class TaskGraph extends React.Component {
  static get propTypes() {
    return {
      taskGraph: PropTypes.instanceOf(Immutable.Map).isRequired,
      dagreGraph: PropTypes.instanceOf(dagre.graphlib.Graph).isRequired,
      chartDimensions: PropTypes.shape({
        width: PropTypes.number.isRequired,
        height: PropTypes.number.isRequired
      }).isRequired,
      refColors: PropTypes.instanceOf(Immutable.Map).isRequired,
      highlightedTaskIds: PropTypes.instanceOf(Immutable.Set).isRequired,
      taskTimesInSeconds: PropTypes.instanceOf(Immutable.Map),
      onSelectRef: PropTypes.func,
      onClickTask: PropTypes.func.isRequired,
      selectedTaskId: PropTypes.string,
      completionStatuses: PropTypes.instanceOf(Immutable.Map).isRequired
    };
  }

  renderNodes() {
    const {
      dagreGraph,
      taskGraph,
      taskTimesInSeconds,
      onClickTask,
      refColors,
      highlightedTaskIds,
      onSelectRef,
      selectedTaskId
    } = this.props;

    return dagreGraph.nodes().map((taskId) => {
      const task = taskGraph.get('tasks').get(taskId);
      const node = dagreGraph.node(taskId);
      const seconds = taskTimesInSeconds ?
        taskTimesInSeconds.get(task.get('id')) : undefined;

      const completionClass = this.props.completionStatuses.get(taskId);

      const isSelected = selectedTaskId === task.get('id');

      const style = {
        cursor: 'pointer',
        position: 'absolute',
        top: node.y,
        left: node.x
      };

      const selectorPadding = 3;
      const selectorBorderWidth = 5;
      const offsetTranslation = -selectorBorderWidth + -selectorPadding;

      const nodeSelectorStyle = {
        position: 'absolute',
        height: `${node.height + 16}px`,
        width: `${node.width + 16}px`,
        padding: `${selectorPadding}px`,
        borderWidth: `${selectorBorderWidth}px`,
        borderStyle: 'solid',
        // border color and div radius use CSS variables
        // and can be found in taskgraph/style.scss
        transform: `translate(
          ${offsetTranslation}px, ${offsetTranslation}px
        )`
      };

      return (
        <div
          style={style}
          key={task.get('id')}
          onClick={() => onClickTask(task.get('id'))}
        >
          { isSelected && (
            <div
              className="node-selector"
              style={nodeSelectorStyle}
            />
          )}
          <TaskGraphNode
            task={task}
            refColors={refColors}
            seconds={seconds}
            isHighlighted={highlightedTaskIds.has(task.get('id'))}
            onClickRefName={onSelectRef}
            width={node.width}
            height={node.height}
            completionClass={completionClass}
          />
        </div>
      );
    });
  }

  render() {
    const {
      dagreGraph,
      highlightedTaskIds,
      taskGraph,
      chartDimensions
    } = this.props;

    const { width, height } = chartDimensions;

    const { rankdir } = this.props.dagreGraph.graph();
    if (rankdir !== 'RL') {
      console.error(`dagre Graph must have orientation RL (Right - Left). Instead it was ${rankdir}`);
    }

    return (
      <div style={{ position: 'relative', width, height }}>
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute' }}>
            <svg height={height} width={width}>
              <TaskGraphEdges
                dagreGraph={dagreGraph}
                highlightedTaskIds={highlightedTaskIds}
              />
              <TimeConstraintEdges
                dagreGraph={dagreGraph}
                timeConstraints={taskGraph.get('timeConstraints')}
                highlightedTaskIds={highlightedTaskIds}
              />
            </svg>
          </div>
          <div style={{ position: 'absolute' }}>
            {this.renderNodes()}
          </div>
        </div>
      </div>
    );
  }
}

export default TaskGraph;
