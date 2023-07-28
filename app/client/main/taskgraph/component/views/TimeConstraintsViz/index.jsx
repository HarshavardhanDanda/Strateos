import React from 'react';
import Immutable from 'immutable';
import PropTypes from 'prop-types';

import TaskGraphNode from 'main/taskgraph/component/TaskGraphNode';
import { tasksInConstraint } from 'main/taskgraph/component/utils/TimeConstraintUtils';

import { Unit } from '@transcriptic/amino';

import './TimeConstraintsViz.scss';

// Map the presence of time constraint start and end points to unique keys
const constraintToKeys = (constraint) => {
  if (constraint.get('from').get('startOf')) {
    if (constraint.get('to').get('startOf')) {
      return 'startToStart';
    }

    if (constraint.get('to').get('endOf')) {
      return 'startToEnd';
    }
  } else if (constraint.get('from').get('endOf')) {
    if (constraint.get('to').get('startOf')) {
      return 'endToStart';
    }

    if (constraint.get('to').get('endOf')) {
      return 'endToEnd';
    }
  }

  // Every time constraint should match one of the conditions above. If it doesn't – something is wrong or the schema
  // was changed outside of this file/component.
  console.warn('Invalid format for time constraint. Expected startOf and endOf key pairings for start and end tasks.');

  return undefined;

};

const assembleGraphs = (timeConstraints) => {
  const constraint_pairs = {};

  // Create an object that groups all the time constraints first by start task, and then by end task
  timeConstraints.forEach((constraint) => {
    const { from, to } = tasksInConstraint(constraint).toJS();

    // if there is no entry for this start task, create an empty object for it
    if (!constraint_pairs[from]) {
      constraint_pairs[from] = {};
    }

    // if there is no entry for this end task in this start task, create an empty object for it
    if (!constraint_pairs[from][to]) {
      constraint_pairs[from][to] = {};
    }

    const timeBounds = {};

    // There are three time bounds that this visualization renders. For each of them, check if it is
    // defined for this time constraint, and if it is, get the value for it and store it in timeBounds object
    ['more_than', 'less_than', 'ideal'].forEach((bound) => {
      if (constraint.get(bound)) {
        timeBounds[bound] = constraint.get(bound);
      }
    });

    // Map the start and end points of the from and to task to a unique key, and store the timebounds for those
    // points as an object.
    const boundKey = constraintToKeys(constraint);
    if (constraint_pairs[from][to][boundKey]) {
      constraint_pairs[from][to][boundKey] = Object.assign(constraint_pairs[from][to][boundKey], timeBounds);
    } else {
      constraint_pairs[from][to][boundKey] = timeBounds;
    }
  });

  return constraint_pairs;

};

const createBoundSummary = (bounds) => {

  let bound;

  if (bounds.less_than && bounds.more_than) {
    const lower = <Unit value={bounds.more_than} convertForDisplay />;
    const upper = <Unit value={bounds.less_than} convertForDisplay />;

    bound = <span>Between {lower} and {upper}.</span>;
  } else if (bounds.less_than) {
    bound = <span>Less than <Unit value={bounds.less_than} convertForDisplay />.</span>;
  } else if (bounds.more_than) {
    bound = <span>More than <Unit value={bounds.more_than} convertForDisplay />.</span>;
  } else if (!bounds.ideal) {
    console.warn('No time bounds found for constraint. Check that the constraint is properly structured');
  }

  const ideally = bounds.ideal && <span>Ideally <Unit value={bounds.ideal.get('value')} convertForDisplay />.</span>;

  let val;

  if (bound && !ideally) {
    val = bound;
  } else if (bound && ideally) {
    val = <span>{bound} {ideally}</span>;
  } else if (!bound && ideally) {
    val = ideally;
  }

  return val;
};

function Bound({ from, to, bound }) {
  return (
    <div className={`constraint-viz__bound constraint-viz__bound--${from}-to-${to}`}>
      <p className="constraint-viz__bound-text desc">{createBoundSummary(bound)}</p>
    </div>
  );
}

Bound.propTypes = {
  from: PropTypes.oneOf(['start', 'end']),
  to: PropTypes.oneOf(['start', 'end']),
  bound: PropTypes.shape({
    less_than: PropTypes.string,
    more_than: PropTypes.string,
    ideal: PropTypes.instanceOf(Immutable.Map)
  })
};

function Curve({ side, inverted }) {
  return (
    <div
      className={
        `constraint-viz__line-curve constraint-viz__line-curve--${side}
        ${inverted ? 'constraint-viz__line-curve--inv' : ''}`
      }
    />
  );
}

Curve.propTypes = {
  side: PropTypes.oneOf(['top', 'bottom']),
  inverted: PropTypes.bool
};

function ConstraintGraph({ bounds, fromId, toId, taskGraph, nodeProps }) {
  return (
    <div className="constraint-viz">
      <If condition={bounds.startToStart}>
        <div className="constraint-viz__bound-row">
          <div className="constraint-viz__row-cap constraint-viz__row-cap--left">
            <Curve side="top" />
          </div>
          <div className="constraint-viz__bound-container">
            <Bound from="start" to="start" bound={bounds.startToStart} />
            <div className="constraint-viz__bound-line" />
          </div>
          <div className="constraint-viz__row-cap  constraint-viz__row-cap--right">
            <Curve side="top" inverted />
          </div>
        </div>
      </If>
      <If condition={bounds.endToStart}>
        <div className="constraint-viz__bound-row">
          <div className="constraint-viz__row-cap constraint-viz__row-cap--left">
            <Curve side="top" />
            <If condition={bounds.startToStart}>
              <Curve side="straight" />
            </If>
          </div>
          <div className="constraint-viz__bound-container">
            <Bound from="end" to="start" bound={bounds.endToStart} />
            <div className="constraint-viz__bound-line" />
          </div>
          <div className="constraint-viz__row-cap constraint-viz__row-cap--right">
            <Curve side="top" inverted />
            <If condition={bounds.startToStart}>
              <Curve side="straight" />
            </If>
          </div>
        </div>
      </If>
      <div className="constraint-viz__inst-row">
        <span className="constraint-viz__inst-dot constraint-viz__inst-dot--start" />
        <div className="constraint-viz__row-cap constraint-viz__row-cap--left">
          <If condition={bounds.startToStart || bounds.endToStart}>
            <Curve side="bottom" />
          </If>
          <If condition={bounds.endToEnd || bounds.startToEnd}>
            <Curve side="top" inverted />
          </If>
        </div>
        <div className="constraint-viz__inst-container">
          <div className="constraint-viz__inst">
            <TaskGraphNode task={taskGraph.getIn(['tasks', fromId])} {...nodeProps} />
          </div>
          <div className="constraint-viz__inst">
            <TaskGraphNode task={taskGraph.getIn(['tasks', toId])} {...nodeProps} />
          </div>
        </div>
        <div className="constraint-viz__row-cap constraint-viz__row-cap--right">
          <If condition={bounds.startToStart || bounds.endToStart}>
            <Curve side="bottom" inverted />
          </If>
          <If condition={bounds.endToEnd || bounds.startToEnd}>
            <Curve side="top" />
          </If>
        </div>
        <span className="constraint-viz__inst-dot constraint-viz__inst-dot--end" />
        <span className="constraint-viz__inst-line" />
      </div>
      <If condition={bounds.endToEnd}>
        <div className="constraint-viz__bound-row">
          <div className="constraint-viz__row-cap constraint-viz__row-cap--left">
            <Curve side="bottom" inverted />
            <If condition={bounds.startToEnd}>
              <Curve side="straight" />
            </If>
          </div>
          <div className="constraint-viz__bound-container">
            <Bound from="end" to="end" bound={bounds.endToEnd} />
            <div className="constraint-viz__bound-line" />
          </div>
          <div className="constraint-viz__row-cap constraint-viz__row-cap--right">
            <Curve side="bottom" />
            <If condition={bounds.startToEnd}>
              <Curve side="straight" inverted />
            </If>
          </div>
        </div>
      </If>
      <If condition={bounds.startToEnd}>
        <div className="constraint-viz__bound-row">
          <div className="constraint-viz__row-cap constraint-viz__row-cap--left">
            <Curve side="bottom" inverted />
          </div>
          <div className="constraint-viz__bound-container">
            <Bound from="start" to="end" bound={bounds.startToEnd} />
            <div className="constraint-viz__bound-line" />
          </div>
          <div className="constraint-viz__row-cap constraint-viz__row-cap--right">
            <Curve side="bottom" />
          </div>
        </div>
      </If>
    </div>
  );
}

ConstraintGraph.propTypes = {
  bounds: PropTypes.shape({
    startToEnd: PropTypes.shape({
      less_than: PropTypes.string,
      more_than: PropTypes.string,
      ideal: PropTypes.instanceOf(Immutable.Map)
    }),
    startToStart: PropTypes.shape({
      less_than: PropTypes.string,
      more_than: PropTypes.string,
      ideal: PropTypes.instanceOf(Immutable.Map)
    }),
    endToEnd: PropTypes.shape({
      less_than: PropTypes.string,
      more_than: PropTypes.string,
      ideal: PropTypes.instanceOf(Immutable.Map)
    }),
    endToStart: PropTypes.shape({
      less_than: PropTypes.string,
      more_than: PropTypes.string,
      ideal: PropTypes.instanceOf(Immutable.Map)
    })
  }),
  fromId: PropTypes.string.isRequired,
  toId: PropTypes.string.isRequired,
  taskGraph: PropTypes.instanceOf(Immutable.Map),
  nodeProps: PropTypes.shape({
    width: PropTypes.string,
    height: PropTypes.string,
    refColors: PropTypes.instanceOf(Object),
    isHighlighted: PropTypes.bool
  })
};

function TimeConstraintsViz(props) {

  const graphs = assembleGraphs(props.timeConstraints);

  const { refColors } = props;

  const nodeProps = {
    width: '100%',
    height: '100%',
    refColors,
    isHighlighted: true
  };

  return (
    <div className="constraint-graphs">
      {
        Object.keys(graphs).map((fromId) => {
          return Object.keys(graphs[fromId]).map((toId) => {
            const bounds = graphs[fromId][toId];
            return (
              <ConstraintGraph
                bounds={bounds}
                nodeProps={nodeProps}
                taskGraph={props.taskGraph}
                fromId={fromId}
                toId={toId}
                key={`${fromId}-${toId}`}
              />
            );
          });
        }).flatten()
      }
    </div>
  );
}

TimeConstraintsViz.propTypes = {
  timeConstraints: PropTypes.instanceOf(Immutable.List),
  taskGraph: PropTypes.instanceOf(Immutable.Map),
  refColors: PropTypes.instanceOf(Immutable.Map)
};

export default TimeConstraintsViz;

export { constraintToKeys, assembleGraphs, createBoundSummary };
