import * as Immutable from 'immutable';
import PropTypes      from 'prop-types';
import React          from 'react';

import GenericTaskNode from 'main/taskgraph/component/GenericTaskNode';

function DestinyTaskNode({ task, refColors, isHighlighted, onClickRefName, height, width }) {
  const isDisposalTask = task.get('discard');

  return (
    <GenericTaskNode
      title={isDisposalTask ? 'Dispose Container' : 'Store Container'}
      objects={Immutable.Iterable([task.get('obj')])}
      refColors={refColors}
      onClickRefName={onClickRefName}
      isHighlighted={isHighlighted}
      width={width}
      height={height}
      nodeClass="destiny auxiliary"
    />
  );
}

// TODO Abstract these propTypes into a shape because they're repeated in the other task nodes.
DestinyTaskNode.propTypes = {
  task:            PropTypes.instanceOf(Immutable.Map).isRequired,
  refColors:       PropTypes.instanceOf(Immutable.Map).isRequired,
  isHighlighted:   PropTypes.bool,
  onClickRefName:  PropTypes.func,
  width:           PropTypes.number.isRequired,
  height:          PropTypes.number.isRequired
};

export default DestinyTaskNode;
