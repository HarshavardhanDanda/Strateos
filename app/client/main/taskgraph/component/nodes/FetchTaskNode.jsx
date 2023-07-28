import * as Immutable from 'immutable';
import PropTypes      from 'prop-types';
import React          from 'react';

import GenericTaskNode from 'main/taskgraph/component/GenericTaskNode';

function FetchTaskNode({ task, refColors, isHighlighted, onClickRefName, height, width }) {
  return (
    <GenericTaskNode
      title="Fetch Container"
      refColors={refColors}
      objects={Immutable.Iterable([task.get('obj')])}
      onClickRefName={onClickRefName}
      isHighlighted={isHighlighted}
      width={width}
      height={height}
      nodeClass="fetch auxiliary"
    />
  );
}

// TODO Abstract these propTypes into a shape because they're repeated in the other task nodes.
FetchTaskNode.propTypes = {
  task:           PropTypes.instanceOf(Immutable.Map),
  refColors:      PropTypes.instanceOf(Immutable.Map).isRequired,
  isHighlighted:  PropTypes.bool,
  onClickRefName: PropTypes.func,
  width:          PropTypes.number.isRequired,
  height:         PropTypes.number.isRequired
};

export default FetchTaskNode;
