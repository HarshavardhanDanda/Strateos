import * as Immutable from 'immutable';
import PropTypes      from 'prop-types';
import React          from 'react';

import GenericTaskNode from 'main/taskgraph/component/GenericTaskNode';

function SupplyTaskNode({ task, refColors, isHighlighted, onClickRefName, height, width }) {
  return (
    <GenericTaskNode
      title="Supply New Container"
      objects={Immutable.Iterable([task.get('obj')])}
      refColors={refColors}
      onClickRefName={onClickRefName}
      isHighlighted={isHighlighted}
      width={width}
      height={height}
      nodeClass="supply auxiliary"
    />
  );
}

// TODO Abstract these propTypes into a shape because they're repeated in the other task nodes.
SupplyTaskNode.propTypes = {
  task:            PropTypes.instanceOf(Immutable.Map).isRequired,
  refColors:       PropTypes.instanceOf(Immutable.Map).isRequired,
  isHighlighted:   PropTypes.bool,
  onClickRefName:  PropTypes.func,
  width:           PropTypes.number.isRequired,
  height:          PropTypes.number.isRequired
};

export default SupplyTaskNode;
