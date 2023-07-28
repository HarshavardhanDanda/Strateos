import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import _ from 'lodash';
import { Utilities } from '@transcriptic/amino';

import LayoutUtils from './LayoutUtils';
import Node from './LiHaNode';
import './LiHaGraph.scss';

const { ManualLiHaDisplayScale, convertUnitForDisplay, formatForDisplay } = Utilities.Units;

const horizPillPadding = 10;
const vertPillPadding = 5;
const normalTextHeight = 14;

// Set a globally available padding constant that sets padding around the SVG enabling overflow when necessary
const graphPadding = 10;

const IS_TEST_ENV = process.env.NODE_ENV === 'test';

class LiHaGraph extends React.Component {

  // Create default state is used during props updates and must remain a static method.
  static createDefaultState(sources, destinations, sourceNodeWidth, destNodeWidth) {
    // Iterate over the unique containers and resources and assign a color from the color scale to each.
    const colorPallete = LayoutUtils.colorPallete(sources, destinations);

    return {
      vizHeight: 0,
      sources: LayoutUtils.setupDefaultStateObjects(
        sources,
        sourceNodeWidth,
        colorPallete
      ),
      destinations: LayoutUtils.setupDefaultStateObjects(
        destinations,
        destNodeWidth,
        colorPallete
      ),
      sourcesOffset: {
        x: graphPadding,
        y: graphPadding
      },
      destinationsOffset: {
        x: graphPadding,
        y: graphPadding
      },
      nodeLineLength: 0,
      centerLine: {
        midPoint: 0,
        top: 0,
        bottom: 0
      },
      popover: {
        x: 0,
        y: 0,
        width: 0,
        content: '',
        visible: false,
        isSourcePopover: false,
        isFlippedPopover: false
      }
    };
  }

  constructor(props) {
    super(props);

    // Initialize an instance variable that will hold the ref to the group surrounding the graphic.
    this.graphicWrapper = undefined;

    // Initialize an instance variable to hold the ref to the text of the popover.
    this.popoverTextNode = undefined;

    this.renderNodes            = this.renderNodes.bind(this);
    this.getGroupOffsetFromNode = this.getGroupOffsetFromNode.bind(this);
    this.calculateVolumeWidths  = this.calculateVolumeWidths.bind(this);
    this.layoutSVGElements      = this.layoutSVGElements.bind(this);
    this.layoutNodes            = this.layoutNodes.bind(this);
    this.layoutColumns          = this.layoutColumns.bind(this);
    this.layoutCenterLine       = this.layoutCenterLine.bind(this);
    this.layoutGraphicHeight    = this.layoutGraphicHeight.bind(this);
    this.showPopover            = this.showPopover.bind(this);
    this.hidePopover            = this.hidePopover.bind(this);

    this.sourcesRefs = {};
    this.destinationsRefs = {};

    this.state = LiHaGraph.createDefaultState(
      _.cloneDeep(this.props.data.sources),
      _.cloneDeep(this.props.data.destinations),
      this.props.sourceNodeWidth,
      this.props.destNodeWidth
    );
  }

  // After the SVG elements have been rendered, they need to be laid out dynamically.
  // componentDidMount is used to handle this in a React friendly way by modifying the state object in several passes
  componentDidMount() {
    if (!IS_TEST_ENV) {
      this.calculateVolumeWidths();
      this.layoutSVGElements();
    }
  }

  componentDidUpdate(prevProps) {
    // If new props were passed, re-layout the graph.
    const reLayoutGraph = () => {
      if (!IS_TEST_ENV) {
        this.calculateVolumeWidths();
        this.layoutSVGElements();
      }
    };

    if (!_.isEqual(prevProps, this.props)) {
      if (!IS_TEST_ENV) {
        this.sourcesRefs = {};
        this.destinationsRefs = {};
      }

      this.setState(LiHaGraph.createDefaultState(
        _.cloneDeep(this.props.data.sources),
        _.cloneDeep(this.props.data.destinations),
        this.props.sourceNodeWidth,
        this.props.destNodeWidth
      ), reLayoutGraph);
    }
  }

  // Upon component mount we need to inspect the textnode dom elements, check their widths, which
  // reflects the volume that each source and destination node sets in the state.
  calculateVolumeWidths() {
    const newState = {};
    newState.sources      = _.cloneDeep(this.state.sources || {});
    newState.destinations = _.cloneDeep(this.state.destinations || {});

    Object.keys(this).forEach(key => {
      // Searching for all refs in the form `textnode_groupkey_nodeid`
      //   Groupkey can be sources or destinations
      //   id can be anything
      if (_.startsWith(key, 'textnode_')) {
        const split    = key.split('_');
        const groupKey = split[1];
        const nodeId   = split[2];
        const node     = this[key];

        const currentNodeState = newState[groupKey][nodeId];

        if (node && node.getBBox().width !== currentNodeState.volumeWidth) {
          currentNodeState.volumeWidth = node.getBBox().width;
        }
      }
    });

    this.setState(newState);
  }

  // shift the first element of the layoutArray off, call it as a function,
  // and pass the shortened array as an argument to layoutSVGElements as a callback to setState
  layoutSVGElements(methods = [this.layoutNodes, this.layoutColumns, this.layoutCenterLine, this.layoutGraphicHeight]) {

    if (methods.length) {
      this.setState(methods.shift(), () => { this.layoutSVGElements(methods); });
    }
  }

  // Layout the nodes in the source and destination columns.
  layoutNodes(state) {

    const arrangedSources = LayoutUtils.layoutNodesInColumn(state.sources, this.sourcesRefs);
    const arrangedDestinations = LayoutUtils.layoutNodesInColumn(
      state.destinations,
      this.destinationsRefs
    );

    return { // eslint-disable-line
      sources: arrangedSources,
      destinations: arrangedDestinations
    };
  }

  // Given the current layout of nodes in state, determine the proper layout for the center line
  layoutCenterLine(state) {

    return LayoutUtils.computeCenterLineLayout(
      state.sources,
      state.destinations,
      this.sourcesSVGGroupRef,
      this.destinationsSVGGroupRef,
      state.sourcesOffset,
      state.destinationsOffset,
      graphPadding,
      this.getGroupOffsetFromNode
    );
  }

  layoutColumns(state) {
    // Following the render of the nodes and columns, layout the center line based on the new values of the
    // nodes and columns.
    return LayoutUtils.computeColumnsLayout(
      this.sourcesSVGGroupRef,
      this.destinationsSVGGroupRef,
      state.sourcesOffset,
      state.destinationsOffset,
      graphPadding,
      this.svgContainer
    );
  }

  // Once layout is complete, measure the height of the graphic, add the necessary padding, and set the height the SVG
  // in state. On re-render, the height of the SVG will be set from state. This has the added benefit of hiding the
  // entire graphic until layout is complete.
  layoutGraphicHeight() {
    return {
      vizHeight: this.graphicWrapper.getBBox().height + (graphPadding * 2)
    };
  }

  // Get the offset values from state for the column this node belongs to.
  getGroupOffsetFromNode(nodeId) {
    if (this.sourcesRefs[nodeId]) {
      return this.state.sourcesOffset;
    } else if (this.destinationsRefs[nodeId]) {
      return this.state.destinationsOffset;
    }

    return undefined;
  }

  // Once popover is displayed, align it based on the node.
  layoutPopover(node, isSourceNode) {

    this.setState(LayoutUtils.computePopoverLayout(
      this.state.sourcesOffset,
      this.state.destinationsOffset,
      node,
      isSourceNode,
      this.popoverTextNode,
      graphPadding,
      this.state.vizHeight
    ));
  }

  // Given a node, set the content for the popover so that sizes can be determined for layout
  showPopover(node, isSourceNode) {

    this.setState({
      popover: {
        x: 0,
        y: 0,
        width: 0,
        content: node.name,
        visible: true,
        isSourcePopover: isSourceNode
      }
    }, () => { this.layoutPopover(node, isSourceNode); });
  }

  hidePopover() {
    this.setState({
      popover: {
        visible: false
      }
    });
  }

  renderLineTipTriangle(origin, size, className) {
    return (
      <polygon
        className={className}
        points={`${origin - 1},-${size} ${origin - 1},${size} ${origin + size},0`}
      />
    );
  }

  renderPopOverTipTriangle() {

    const xOffset = this.state.popover.isSourcePopover ? 45 : ((this.state.popover.width || 0) - 45);
    const yOffset = this.state.popover.isFlippedPopover ? 26 : 1;
    const size = 5;

    const points = [
      {
        x: xOffset + size,
        y: yOffset
      },
      {
        x: xOffset - size,
        y: yOffset
      },
      {
        x: xOffset,
        y: this.state.popover.isFlippedPopover ? (yOffset + size) : (yOffset - size)
      }
    ];

    return (
      <polygon
        points={points.reduce((acc, point) => { return `${acc} ${point.x},${point.y} `; }, '')}
        className="liha-graph__popover-tip"
      />
    );
  }

  // Render the horizonal connecting lines for the provided nodes.
  // Lines render different if the nodes are sources or destinations.
  renderNodeLines(nodes, isSource) {
    // Define a group key for use later.
    const groupKey = isSource ? 'sources' : 'destinations';

    // Map over the IDs of the provided nodes
    return _.map(nodes, (nodeData, nodeId) => {
      // If the graph is a pure 1:1 graph (single source and dest, and each with a single aliquot), then this
      // connector is rendered as a special case with only one volume pill.
      const isFullConnector = LayoutUtils.isGraphOneToOne(this.props.data);

      const {
        x1,
        x2,
        volumePillWidth,
        volumePillHeight,
        volumePillHorizOffset,
        volumePillVertOffset,
        volumeTextHorizOffset,
        subtitleHorizOffset,
        subtitleVertOffset,
        yOffset
      } = LayoutUtils.computeNodeLineLayout(
        nodes[nodeId],
        isSource,
        horizPillPadding,
        vertPillPadding,
        normalTextHeight,
        isFullConnector,
        this.state.sourcesOffset,
        this.state.destinationsOffset,
        this.state.centerLine
      );

      // x1 is used to shift the group containing the line over, making x1 for the line 0
      // Therefor, x2 for the line becomes the difference between x2 and x1.
      const relativeX2 = x2 - x1;

      return (
        <g key={nodeId} transform={LayoutUtils.translate(x1, yOffset)}>
          <If condition={isSource}>
            <circle
              r={3.5}
              cx={0}
              cy={0}
              className="liha-graph__line-end"
            />
          </If>
          <If condition={(!isFullConnector && !isSource) || (isSource && isFullConnector)}>
            {this.renderLineTipTriangle(relativeX2, 5, 'liha-graph__line-end')}
          </If>
          <line
            className="liha-graph__line"
            y1={0}
            y2={0}
            x1={0}
            x2={relativeX2}
          />
          <If condition={!(!isSource && isFullConnector)}>
            <g transform={LayoutUtils.translate(volumePillHorizOffset, volumePillVertOffset)}>
              <rect
                className="liha-graph__line-pill"
                x={0}
                y={0}
                width={volumePillWidth}
                height={volumePillHeight}
                rx={3}
                ry={3}
              />
              <text
                ref={(node) => { this[`textnode_${groupKey}_${nodeId}`] = node; }}
                x={volumeTextHorizOffset}
                y={vertPillPadding}
                className="liha-graph__text liha-graph__text--dark liha-graph__text--normal"
                alignmentBaseline="hanging"
              >
                {formatForDisplay(convertUnitForDisplay(nodes[nodeId].quantity, { scale: ManualLiHaDisplayScale }), true)}
              </text>
              <If condition={nodes[nodeId].aliquots > 1}>
                <text
                  className="liha-graph__text liha-graph__text--light liha-graph__text--small"
                  x={subtitleHorizOffset}
                  y={subtitleVertOffset}
                  alignmentBaseline="hanging"
                >
                  per well
                </text>
              </If>
            </g>
          </If>
        </g>
      );
    });
  }

  // Given a list of nodes, and an object to store refs, render the nodes appropriately
  renderNodes(nodes, refObject, isSource) {
    const nodeElements = _.map(nodes, (nodeData, nodeId) => {
      return (
        <Node
          key={nodeId}
          ref={(node) => { refObject[nodeId] = node; }}
          node={nodeData}
          nodeId={nodeId}
          isSourceNode={isSource}
          pillPadding={horizPillPadding}
          normalTextHeight={normalTextHeight}
          popoverShow={this.showPopover}
          popoverHide={this.hidePopover}
        />
      );
    });
    return nodeElements;
  }

  render() {
    if (IS_TEST_ENV) {
      return <span>SVG not rendered for test environment</span>;
    }

    return (
      <svg
        width={this.props.width}
        height={this.state.vizHeight}
        ref={(node) => { this.svgContainer = node; }}
        className="liha-graph"
      >
        <defs>
          <filter id="shadow" height="180%">
            <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#e6e6e6" />
          </filter>
          <filter id="tip-border" height="180%">
            <feDropShadow
              dx="0"
              dy={this.state.popover.isFlippedPopover ? 2 : -2}
              stdDeviation="0"
              floodColor="#e6e6e6"
            />
          </filter>
        </defs>
        <g ref={(node) => { this.graphicWrapper = node; }}>
          <g
            ref={(node) => { this.sourcesSVGGroupRef = node; }}
            transform={LayoutUtils.translate(this.state.sourcesOffset.x, this.state.sourcesOffset.y)}
          >
            {this.renderNodes(this.state.sources, this.sourcesRefs, true)}
          </g>
          <g
            ref={(node) => { this.destinationsSVGGroupRef = node; }}
            transform={LayoutUtils.translate(this.state.destinationsOffset.x, this.state.destinationsOffset.y)}
          >
            {this.renderNodes(this.state.destinations, this.destinationsRefs, false)}
          </g>
          {this.renderNodeLines(this.state.sources, true)}
          <line
            className="liha-graph__line"
            x1={this.state.centerLine.midPoint}
            x2={this.state.centerLine.midPoint}
            y1={this.state.centerLine.top}
            y2={this.state.centerLine.bottom}
          />
          {this.renderNodeLines(this.state.destinations, false)}
        </g>
        <g
          transform={LayoutUtils.translate(this.state.popover.x || 0, this.state.popover.y || 0)}
          className={classNames('liha-graph__popover', { 'liha-graph__popover--visible': this.state.popover.visible })}
        >
          <rect
            className="liha-graph__popover-background"
            width={this.state.popover.width}
            height={26}
            rx={3}
            ry={3}
          />
          {this.renderPopOverTipTriangle()}
          <text
            x={5}
            y={13}
            alignmentBaseline="middle"
            fontSize={12}
            className="liha-graph__popover-text"
            ref={(node) => {
              this.popoverTextNode = node;
            }}
          >{this.state.popover.content}
          </text>
        </g>
      </svg>
    );
  }
}

LiHaGraph.propTypes = {
  width: PropTypes.number,
  data: PropTypes.shape({
    sources: PropTypes.instanceOf(Object),
    destinations: PropTypes.instanceOf(Object),
    edges: PropTypes.arrayOf(PropTypes.instanceOf(Object))
  }),
  sourceNodeWidth: PropTypes.number,
  destNodeWidth: PropTypes.number
};

LiHaGraph.defaultProps = {
  width: 600
};

export default LiHaGraph;
