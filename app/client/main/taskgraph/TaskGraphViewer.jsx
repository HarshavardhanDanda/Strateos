import * as Immutable from 'immutable';
import keycode from 'keycode';
import PropTypes from 'prop-types';
import React from 'react';
import _ from 'lodash';
import { MapInteractionCSS } from 'react-map-interaction';
import screenfull from 'screenfull';
import classnames from 'classnames';

import { ToggleButton, ButtonGroup, DropDown } from '@transcriptic/amino';

import TaskGraph from 'main/taskgraph/component/TaskGraph';
import { TabLayout } from 'main/components/TabLayout';
import { calculateDAG, findInitialCoordinates } from 'main/taskgraph/component/utils/ViewUtils';
import generateTaskGraph from 'main/taskgraph/component/utils/GenerateTaskGraphUtil';
import taskHasRef from 'main/taskgraph/component/utils/ReferenceUtil';
import TaskDetailPanel from 'main/taskgraph/TaskDetailPanel';
import InstructionStore from 'main/stores/InstructionStore';
import { mergeInstructionsWithWarps } from 'main/helpers/RunPage/assembleFullJSON';
import InstructionHelpers from 'main/helpers/Instruction';

import './TaskGraphViewer.scss';

const NODE_HEIGHT = 100;
const NODE_WIDTH = 200;

const taskIdParts = (taskId) => {
  const [type, seqNoOrRef] = taskId.split('|');
  return {
    type,
    seqNoOrRef
  };
};

const centeredCoordinatesWithinContainer = (coordinates, containerWidth, containerHeight) => {
  const centerX = coordinates.x - ((containerWidth / 2) - 100);
  const centerY = coordinates.y - ((containerHeight / 2) - 50);
  return {
    x: centerX,
    y: centerY
  };
};

function TaskGraphLegend() {
  return (
    <div className="task-graph-legend">
      <div className="task-graph-legend__item">
        <span
          className={
            classnames(
              'task-graph-legend__demo',
              'task-graph-legend__demo--dependencies',
              'task-graph-legend__demo--line'
            )
          }
        />
        <p className="desc task-graph-legend__text">Dependencies</p>
      </div>
      <div className="task-graph-legend__item">
        <span
          className={
            classnames(
              'task-graph-legend__demo',
              'task-graph-legend__demo--constraints',
              'task-graph-legend__demo--line'
            )
          }
        />
        <p className="desc task-graph-legend__text">Constraints</p>
      </div>
      <div className="task-graph-legend__item">
        <span
          className={
            classnames(
              'task-graph-legend__demo',
              'auxiliary',
              'task-graph-legend__demo--box'
            )
          }
        />
        <p className="desc task-graph-legend__text">Auxiliary Task</p>
      </div>
      <div className="task-graph-legend__item">
        <span
          className={
            classnames(
              'task-graph-legend__demo',
              'pending',
              'task-graph-legend__demo--box'
            )
          }
        />
        <p className="desc task-graph-legend__text">Pending Task</p>
      </div>
      <div className="task-graph-legend__item">
        <span
          className={
            classnames(
              'task-graph-legend__demo',
              'started',
              'task-graph-legend__demo--box'
            )
          }
        />
        <p className="desc task-graph-legend__text">Running Task</p>
      </div>
      <div className="task-graph-legend__item">
        <span
          className={
            classnames(
              'task-graph-legend__demo',
              'completed',
              'task-graph-legend__demo--box'
            )
          }
        />
        <p className="desc task-graph-legend__text">Completed Task</p>
      </div>
    </div>
  );
}

class TaskGraphControls extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      legendShown: false
    };
  }

  render() {
    return (
      <ButtonGroup>
        <If condition={screenfull.enabled}>
          <ToggleButton
            ref={(node) => { this.fullScreenNode = node; }}
            icon={screenfull.isFullscreen ? 'fa fa-times' : 'fa fa-expand'}
            onClick={() => {
              screenfull.toggle(this.props.taskGraphViewerNode);
              // Immediately blur this button so it does not stay outlined after the click
              this.fullScreenNode.blur();
            }}
            tiny
          />
        </If>
        <div ref={(n) => { this.node = n; }} style={{ position: 'relative' }}>
          <ToggleButton
            icon="fa fa-info"
            onClick={() => { this.setState({ legendShown: true }); }}
            active={this.state.legendShown}
            tiny
          />
          <DropDown
            isOpen={this.state.legendShown}
            hideDismissable={() => this.setState({ legendShown: false })}
            excludedParentNode={this.node}
            header="Legend"
          >
            <TaskGraphLegend />
          </DropDown>
        </div>
      </ButtonGroup>
    );
  }
}

TaskGraphControls.propTypes = {
  taskGraphViewerNode: PropTypes.instanceOf(Object)
};

// Fancy component for interacting with a TaskGraph #100 #teamwork
class TaskGraphViewer extends React.Component {
  static get propTypes() {
    return {
      run:                PropTypes.instanceOf(Immutable.Map).isRequired,
      refColors:          PropTypes.instanceOf(Immutable.Map).isRequired,
      taskTimesInSeconds: PropTypes.instanceOf(Immutable.Map),
      onDeselectRef:      PropTypes.func,
      onSelectRef:        PropTypes.func,
      isLoadingInstructions: PropTypes.bool
    };
  }

  constructor(props) {
    super(props);

    _.bindAll(
      this,
      'onSelectRef',
      'onClickTask',
      'onKeyUp',
      'onClickDetailPanelClose'
    );

    const taskGraph = generateTaskGraph(props.run);

    this.state = {
      taskGraph,
      dagreGraph: calculateDAG(taskGraph, NODE_WIDTH, NODE_HEIGHT),
      selectedRefName: undefined,
      initialX: undefined,
      initialY: undefined,
      completionStatuses: this.getCompletionMap(taskGraph, props.run)
    };
  }

  componentDidMount() {
    // Re-render when user enters and exists full screen
    if (screenfull.enabled) {
      screenfull.on('change', () => this.forceUpdate());
    }

    window.addEventListener('keyup', this.onKeyUp);
    const container = this.taskGraphViewerNode.getBoundingClientRect();

    const initialCoordinates = findInitialCoordinates(
      this.state.taskGraph,
      this.state.dagreGraph
    );

    const { x, y } = centeredCoordinatesWithinContainer(
      initialCoordinates,
      container.width,
      container.height
    );

    this.setState({ // eslint-disable-line react/no-did-mount-set-state
      initialX: -x,
      initialY: -y
    });
  }

  onKeyUp(e) {
    const character = keycode(e);
    if (character === 'esc' && this.state.selectedTaskId != undefined) {
      this.setState({
        selectedTaskId: undefined,
        selectedRefName: undefined
      });
    }
  }

  onSelectRef(refName) {
    this.props.onSelectRef(refName);
    if (!refName) {
      return;
    }
    if (refName === this.state.selectedRefName) {
      this.props.onDeselectRef(refName);
      this.setState({
        selectedRefName: undefined,
        selectedTaskId: undefined
      });
    } else {
      this.props.onSelectRef(refName);
      this.setState({
        selectedRefName: refName,
        selectedTaskId: undefined
      });
    }
  }

  onClickTask(id) {
    this.setState({ selectedTaskId: id });
  }

  onClickDetailPanelClose() {
    this.setState({ selectedTaskId: undefined });
  }

  getHighlightedTaskIds(selectedRefName, taskGraph = this.state.taskGraph) {
    let tasks = taskGraph.get('tasks');

    if (selectedRefName) {
      tasks = tasks.filter(task => taskHasRef(task, selectedRefName));
    }

    return tasks
      .map(task => task.get('id'))
      .toSet();
  }

  getCompletionMap(taskGraph, run) {
    if (!run) {
      return Immutable.Map();
    }

    const instructions = InstructionStore.getByRunId(run.get('id'));
    return taskGraph.get('tasks').map((task) => {
      return InstructionHelpers.getCompletionStatusFromTask(task, instructions);
    });
  }

  taskIsNatural(taskId) {
    return taskIdParts(taskId).type === 'InstructionTask';
  }

  selectedInstruction() {
    const { seqNoOrRef } = taskIdParts(this.state.selectedTaskId);
    const sequenceNo = parseInt(seqNoOrRef, 10);

    const instruction = InstructionStore
      .getAll()
      .find(i => i.get('sequence_no') === sequenceNo);

    const merged = mergeInstructionsWithWarps([instruction]);

    return merged[0];
  }

  render() {
    const { refColors, taskTimesInSeconds, onDeselectRef, run, isLoadingInstructions } = this.props;
    const { taskGraph, selectedTaskId, selectedRefName, dagreGraph,
      initialX, initialY, completionStatuses }  = this.state;

    const { width, height } = dagreGraph.graph();
    const chartDimensions = { width, height };

    const highlightedTaskIds = this.getHighlightedTaskIds(selectedRefName);

    const hasSelected = Boolean(selectedTaskId);
    const selectedIsNatural = hasSelected && this.taskIsNatural(selectedTaskId);

    return (
      <TabLayout theme="gray">
        <div
          ref={(node) => { this.taskGraphViewerNode = node; }}
          className="task-graph-viewer"
        >
          <If condition={initialX && initialY}>
            <div className="task-graph-viewer__main-graph-container">
              <MapInteractionCSS
                defaultValue={{
                  translation: { x: initialX, y: initialY },
                  scale: 1
                }}
              >
                <TaskGraph
                  taskGraph={taskGraph}
                  dagreGraph={dagreGraph}
                  chartDimensions={chartDimensions}
                  refColors={refColors}
                  completionStatuses={completionStatuses}
                  taskTimesInSeconds={taskTimesInSeconds}
                  highlightedTaskIds={highlightedTaskIds}
                  onSelectRef={this.onSelectRef}
                  onDeselectRef={onDeselectRef}
                  onClickTask={this.onClickTask}
                  selectedTaskId={selectedTaskId}
                />
              </MapInteractionCSS>
            </div>
          </If>
          <TaskDetailPanel
            taskId={this.state.selectedTaskId}
            taskGraph={taskGraph}
            refColors={this.props.refColors}
            isNaturalTask={selectedIsNatural}
            isLoadingInstructions={isLoadingInstructions}
            instruction={selectedIsNatural ? this.selectedInstruction() : undefined}
            run={run}
            onClose={this.onClickDetailPanelClose}
            visible={!!selectedTaskId}
          />
          <div className="task-graph-viewer__buttons">
            <TaskGraphControls taskGraphViewerNode={this.taskGraphViewerNode} />
          </div>
        </div>
      </TabLayout>
    );
  }
}

export default TaskGraphViewer;
