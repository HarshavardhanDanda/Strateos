import * as Immutable from 'immutable';
import PropTypes      from 'prop-types';
import React          from 'react';

import NodeTitle from 'main/taskgraph/component/nodes/NodeTitle';
import TaskGraphStyle from 'main/taskgraph/component/TaskGraphStyle';
import RefsListForObjects from 'main/taskgraph/component/RefsListForObjects';

import './GenericTaskNode.scss';

function GenericTaskNode(props) {
  const {
    title,
    objects,
    refColors,
    onClickRefName,
    isHighlighted,
    width,
    height,
    seconds,
    nodeClass
  } = props;

  const opacity = isHighlighted ? 1 : TaskGraphStyle.deselectedOpacity;
  const style = TaskGraphStyle.nodeContainerStyle(width, height, opacity);

  return (
    <div style={style} className={`${nodeClass} taskgraph-node`}>
      <div style={{ fontSize: '.75em', lineHeight: '1em', marginBottom: '1em' }}>
        <div style={{ marginBottom: '0.5em' }}>
          <NodeTitle title={title} />
        </div>
        {
          !isNaN(seconds) ? <div>`${Math.floor(seconds)} sec.`</div> : undefined
        }
      </div>
      <RefsListForObjects
        objects={objects}
        refColors={refColors}
        onClickRefName={onClickRefName}
      />
    </div>
  );
}

GenericTaskNode.propTypes = {
  title:           PropTypes.string.isRequired,
  objects:         PropTypes.instanceOf(Immutable.Iterable).isRequired,
  refColors:       PropTypes.instanceOf(Immutable.Map).isRequired,
  onClickRefName:  PropTypes.func,
  isHighlighted:   PropTypes.bool,
  width:           PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  height:          PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  seconds:         PropTypes.number,
  nodeClass:       PropTypes.string
};

export default GenericTaskNode;
