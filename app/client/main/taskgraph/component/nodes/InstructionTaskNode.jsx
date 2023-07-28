import * as Immutable from 'immutable';
import PropTypes      from 'prop-types';
import React          from 'react';

import GenericTaskNode from 'main/taskgraph/component/GenericTaskNode';

// Abstract these propTypes into a shape because they're repeated in the other task nodes.
const propTypes = {
  task:            PropTypes.instanceOf(Immutable.Map).isRequired,
  refColors:       PropTypes.instanceOf(Immutable.Map).isRequired,
  seconds:         PropTypes.number,
  onClickRefName:  PropTypes.func,
  isHighlighted:   PropTypes.bool,
  width:           PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  height:          PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  completionClass: PropTypes.string
};

function InstructionTaskNode(props) {
  const {
    task,
    refColors,
    seconds,
    onClickRefName,
    isHighlighted,
    width,
    height,
    completionClass
  } = props;

  const operationName = task.getIn(['instruction', 'op']);
  return (
    <GenericTaskNode
      title={`${operationName} (${task.get('sequenceNo')})`}
      refColors={refColors}
      seconds={seconds}
      objects={task.get('requiredObjects')}
      onClickRefName={onClickRefName}
      isHighlighted={isHighlighted}
      width={width}
      height={height}
      nodeClass={completionClass}
    />
  );
}

InstructionTaskNode.propTypes = propTypes;

export default InstructionTaskNode;
