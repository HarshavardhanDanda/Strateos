import React from 'react';
import Immutable from 'immutable';
import PropTypes from 'prop-types';

import InstructionCard from 'main/components/InstructionCard';
import DetailPanel from 'main/taskgraph/DetailPanel';
import TimeConstraintList from 'main/taskgraph/TimeConstraintList';
import { Subtabs, Spinner } from '@transcriptic/amino';
import TaskGraphNode from 'main/taskgraph/component/TaskGraphNode';
import { timeConstraintsForTask } from 'main/taskgraph/component/utils/TimeConstraintUtils';
import { viewedTaskDetails, viewedTimeConstraints } from 'main/analytics/TaskGraphAnalytics';

class TaskDetailPanel extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showingTask: true
    };
  }

  componentDidMount() {
    viewedTaskDetails(this.props.run.get('id'), this.props.taskId);
  }

  task() {
    return this.props.taskGraph.getIn(['tasks', this.props.taskId]);
  }

  render() {
    const {
      taskId,
      taskGraph,
      refColors,
      instruction,
      run,
      onClose,
      isNaturalTask,
      isLoadingInstructions
    } = this.props;

    const constraints = timeConstraintsForTask(this.props.taskId, this.props.taskGraph);
    const onClickConstraints = () => {
      viewedTimeConstraints(this.props.run.get('id'), this.props.taskId);
      this.setState({ showingTask: false });
    };

    const header = (
      <Subtabs activeItemKey={this.state.showingTask ? 'task' : 'constraints'}>
        <span key="task" onClick={() => this.setState({ showingTask: true })}>Task</span>
        <span key="constraints" onClick={onClickConstraints}>{`Constraints (${constraints.count()})`}</span>
      </Subtabs>
    );

    let body;
    if (isNaturalTask && !instruction && isLoadingInstructions) {
      body = <Spinner />;
    } else if (!taskId) {
      body = undefined;
    } else if (this.state.showingTask && instruction) {
      body = (
        <InstructionCard
          instruction={instruction}
          run={run}
          expanded
        />
      );
    } else if (this.state.showingTask) {
      body = (
        <TaskGraphNode
          task={this.task()}
          width={350}
          height={200}
          refColors={refColors}
          isHighlighted
        />
      );
    } else {
      body = (
        <TimeConstraintList
          taskId={taskId}
          taskGraph={taskGraph}
          refColors={refColors}
        />
      );
    }

    return (
      <DetailPanel
        header={header}
        onClose={onClose}
        onClick={e => e.stopPropagation()}
        visible={this.props.visible}
      >

        {body}
      </DetailPanel>
    );
  }
}

TaskDetailPanel.propTypes = {
  taskId: PropTypes.string,
  taskGraph: PropTypes.instanceOf(Immutable.Map).isRequired,
  refColors: PropTypes.instanceOf(Object).isRequired,
  instruction: PropTypes.instanceOf(Immutable.Map),
  run: PropTypes.instanceOf(Immutable.Map).isRequired,
  onClose: PropTypes.func.isRequired,
  isNaturalTask: PropTypes.bool,
  isLoadingInstructions: PropTypes.bool,
  visible: PropTypes.bool
};

export default TaskDetailPanel;
