import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import Chroma from 'chroma-js';

import './LiHaNode.scss';

class Node extends React.Component {

  static calcAllowableTextWidth(nodeWidth, pillPadding) {
    return nodeWidth - (pillPadding * 2);
  }

  static calcClipPathId(nodeId, nodeContainerId) {
    return `${nodeId}-${nodeContainerId}-clip-path`;
  }

  constructor(props) {
    super(props);

    this.allowableTextWidth = Node.calcAllowableTextWidth(this.props.node.width, this.props.pillPadding);
    this.clipPathId = Node.calcClipPathId(this.props.nodeId, this.props.node.containerId);

    this.state = {
      nameTextWidth: 0
    };
  }

  componentDidMount() {
    if (this.textElem && (this.state.nameTextWidth !== this.textElem.getBBox().width)) {
      this.setState({ nameTextWidth: this.textElem.getBBox().width }); // eslint-disable-line
    }
  }

  componentWillUpdate(nextProps) {
    this.allowableTextWidth = Node.calcAllowableTextWidth(nextProps.node.width, nextProps.pillPadding);
    this.clipPathId = Node.calcClipPathId(nextProps.nodeId, nextProps.node.containerId);
  }

  render() {
    const nameTextExceedsWidth = this.state.nameTextWidth > this.allowableTextWidth;
    return (
      <g
        transform={`translate(${this.props.node.x}, ${this.props.node.y})`}
        ref={(node) => { this.nodeGroup = node; }}
        className={classNames('liha-node', { 'liha-node--selected': this.props.node.selected })}
        onMouseOver={() => {
          if (nameTextExceedsWidth) {
            this.props.popoverShow(this.props.node, this.props.isSourceNode);
          }
        }}
        onMouseOut={() => { if (nameTextExceedsWidth) { this.props.popoverHide(); } }}
        onClick={this.props.node.onClick}
      >
        <rect
          rx="5"
          ry="5"
          x={0}
          y={0}
          width={this.props.node.width}
          height={this.props.node.height}
          fill={this.props.node.color}
          stroke={Chroma(this.props.node.color).darken(1.5)}
          className="liha-node__rect"
        />
        <clipPath id={this.clipPathId}>
          <text
            ref={(textElem) => { this.textElem = textElem; }}
            className="liha-node__text liha-node__name"
            x={this.props.pillPadding}
            y="20"
            fontSize={14}
          >{this.props.node.name}
          </text>
        </clipPath>
        <If condition={nameTextExceedsWidth}>
          <text
            className="liha-node__text liha-node__name-ellipsis"
            textAnchor="end"
            x={this.props.pillPadding + this.allowableTextWidth}
            y="20"
          >...
          </text>
        </If>
        <rect
          x={this.props.pillPadding}
          y={0}
          width={nameTextExceedsWidth ? this.allowableTextWidth - 12 : this.allowableTextWidth}
          height={this.props.node.height}
          className="liha-node__clipping-rect"
          clipPath={`url(#${this.clipPathId})`}
        />
        <If condition={this.props.node.aliquots > 1}>
          <text
            className="liha-node__text liha-node__wells"
            x={this.props.pillPadding}
            y={this.props.normalTextHeight + 25}
          >{`${this.props.node.aliquots} wells`}
          </text>
        </If>
        <If condition={this.props.node.selected}>
          <g>
            <circle cx={this.props.node.width - 2} cy={2} r={10} className="liha-node__selected-circle" />
            <text x={this.props.node.width - 8} y={7} className="liha-node__selected-check">&#xF00C;</text>
          </g>
        </If>
      </g>
    );
  }
}

Node.propTypes = {
  nodeId: PropTypes.string.isRequired,
  node: PropTypes.shape({
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    width: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    aliquots: PropTypes.number.isRequired,
    color: PropTypes.string,
    selected: PropTypes.bool,
    containerId: PropTypes.string,
    onClick: PropTypes.func
  }).isRequired,
  normalTextHeight: PropTypes.number,
  isSourceNode: PropTypes.bool,
  pillPadding: PropTypes.number,
  popoverShow: PropTypes.func,
  popoverHide: PropTypes.func
};

Node.defaultProps = {
  normalTextHeight: 14,
  pillPadding: 10
};

export default Node;
