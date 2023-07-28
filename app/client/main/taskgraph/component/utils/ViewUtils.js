// Utilities for working with dagre and the autoprotocol TaskGraph object
import * as dagre from 'dagre';
import reduce from 'lodash/reduce';

const findLeftMostNode = (nodes, dagreGraph) => {
  const firstNode = dagreGraph.node(Object.keys(nodes)[0]);
  return reduce(nodes, (prev, _, id) => {
    const { x, y } = dagreGraph.node(id);
    if (x < prev.x) {
      return { x, y };
    }
    return prev;
  }, {
    x: firstNode.x,
    y: firstNode.y
  });
};

// find all nodes that only exist in '_2' and never in '_1', aka root node with no dependency.
const findRootNodes = (taskGraph) => {
  const nodesBeingDependedOn = {};
  const nodesWithDependency = {};

  taskGraph.get('dependencies').forEach((dep) => {
    const nodeWithDependency = dep.get('_1');
    const nodeBeingDependedOn = dep.get('_2');

    nodesWithDependency[nodeWithDependency] = true;
    nodesBeingDependedOn[nodeBeingDependedOn] = true;

    if (nodesWithDependency[nodeBeingDependedOn] && nodesBeingDependedOn[nodeBeingDependedOn]) {
      delete nodesBeingDependedOn[nodeBeingDependedOn];
    }
  });

  return nodesBeingDependedOn;
};

const findInitialCoordinates = (taskGraph, dagreGraph) => {
  const rootNodes = findRootNodes(taskGraph);
  return findLeftMostNode(rootNodes, dagreGraph);
};

// Convert our TaskGraph model to dagre's Graph model
const calculateDAG = (taskGraph, nodeWidth, nodeHeight) => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setGraph({
    rankdir: 'RL',
    ranker: 'longest-path'
  });
  dagreGraph.setDefaultEdgeLabel(() => {
    // This seems necessary from the docs
    return {};
  });
  taskGraph.get('tasks').forEach((task) => {
    dagreGraph.setNode(
      task.get('id'),
      { label: task.get('id'), width: nodeWidth, height: nodeHeight }
    );
  });
  taskGraph.get('dependencies').forEach((dep) => {
    // NOTE: ['_1', '_2'] in our TaskGraph maps to ['v', 'w'] in dagre.
    // We should standardize these.  TCLE uses _1 and _2 to mean _1 depends on _2.
    dagreGraph.setEdge(dep.get('_1'), dep.get('_2'));
  });
  dagre.layout(dagreGraph);
  return dagreGraph;
};

const clamp = (min, value, max) =>
  Math.max(min, Math.min(value, max));

export {
  calculateDAG,
  clamp,
  findInitialCoordinates
};
