import Chroma from 'chroma-js';
import _ from 'lodash';

class LayoutUtils {

  // Create an object with keys of container/resource IDs that map to unique HEX color strings (#ffffff)
  static colorPallete(sourceStateObjs, destinationStateObjs) {
    const srcIds = _.map(sourceStateObjs, sourceStateObj => sourceStateObj.containerId);
    const dstIds = _.map(destinationStateObjs, destStateObj => destStateObj.containerId);

    const uniqContainers = _.uniq(srcIds.concat(dstIds));

    // Generate a color scale from CubeHelix with a color for each unique container/resource
    const palette = Chroma.cubehelix()
      .start(250)
      .rotations(-0.75)
      .gamma(0.3)
      .lightness([0.4, 0.7])
      .scale()
      .correctLightness()
      .colors(uniqContainers.length);

    // Place the members of the color array in a map of container IDs to colors.
    return _.fromPairs(
      uniqContainers.map((id, index) => [id, palette[index]])
    );
  }

  // Get the lowest and highest nodes.
  static getBoundingNodes(sourceStateObjs, destinationStateObjs, getGroupOffsetFromNode) {
    // highest and lowest indicate visual placement, not numeric value
    let lowestYVal = 0;
    let highestYVal = Infinity;

    let lowestNodeId;
    let highestNodeId;

    const combinedNodeRefs = { ...sourceStateObjs, ...destinationStateObjs };

    _.forEach(combinedNodeRefs, (nodeData, nodeId) => {
      const offsetForNode = getGroupOffsetFromNode(nodeId);

      const topYVal = offsetForNode.y + nodeData.y;
      const bottomYVal = topYVal + nodeData.height;

      if (bottomYVal > lowestYVal) {
        lowestYVal = bottomYVal;
        lowestNodeId = nodeId;
      }

      if (topYVal < highestYVal) {
        highestYVal = topYVal;
        highestNodeId = nodeId;
      }
    });

    return { highestNodeId, lowestNodeId };
  }

  // Get the x value that is the midpoint between the right side of the source column and
  // the left side of the destination column
  static calcMidPointBetweenGroups(sourcesSVGGroupRef, destinationsSVGGroupRef, sourcesOffset, destinationsOffset) {

    const sourcesSVGGroupRefBBox = sourcesSVGGroupRef.getBBox();
    const distBetweenGroups = LayoutUtils.calcDistBetweenGroups(
      sourcesSVGGroupRef,
      destinationsSVGGroupRef,
      sourcesOffset,
      destinationsOffset
    );
    return sourcesOffset.x + sourcesSVGGroupRefBBox.width + (distBetweenGroups / 2);
  }

  // Get the total distance between the right side of the sources column and the left side of the destination column
  static calcDistBetweenGroups(sourcesSVGGroupRef, destinationsSVGGroupRef, sourcesOffset, destinationsOffset) {
    if (sourcesSVGGroupRef && destinationsSVGGroupRef) {
      const sourcesSVGGroupRefBBox = sourcesSVGGroupRef.getBBox();
      const x1 = sourcesOffset.x + sourcesSVGGroupRefBBox.width;
      const x2 = destinationsOffset.x;

      return x2 - x1;
    }

    return 0;
  }

  static translate(x, y) {
    return `translate(${x}, ${y})`;
  }

  // Given node references and their current values in state for a column (source or destination),
  // layout the nodes vertically.
  static layoutNodesInColumn(nodesObj, nodeRefs) {
    let prevY = 0;
    let prevHeight;

    // Iterate over each nodeId key in the nodeRefs object
    Object.keys(nodeRefs).forEach((nodeId) => {

      // Calculate a new Y value based on the height and vertical offset the node above, if it exists.
      const newY = prevHeight ? prevY + prevHeight + 10 : 0;

      // Update the node object for this ID with the new Y offset.
      nodesObj[nodeId].y = newY;
      // Update the historical previous y value and height for use on the next iteration of the loop
      prevY = newY;
      prevHeight = nodeRefs[nodeId].nodeGroup.getBBox().height;
    });

    return nodesObj;
  }

  static computeCenterLineLayout(
    sourceStateObjs,
    destinationStateObjs,
    sourcesSVGGroupRef,
    destinationsSVGGroupRef,
    sourcesOffset,
    destinationsOffset,
    graphPadding,
    getGroupOffsetFromNode
  ) {
    // Get the highest and lowest nodes. The center line must run between their vertical positions.
    const { highestNodeId, lowestNodeId } = LayoutUtils.getBoundingNodes(
      sourceStateObjs,
      destinationStateObjs,
      getGroupOffsetFromNode
    );

    // Given the width and position of the two columns, determine the midpoint and total distance between them.
    const centerLineMidPoint = LayoutUtils.calcMidPointBetweenGroups(
      sourcesSVGGroupRef,
      destinationsSVGGroupRef,
      sourcesOffset,
      destinationsOffset
    );

    const nodeLineLength = LayoutUtils.calcDistBetweenGroups(
      sourcesSVGGroupRef,
      destinationsSVGGroupRef,
      sourcesOffset,
      destinationsOffset
    ) / 2;

    // Get the current values for the highest and lowest nodes from state.
    // They may be in either the source, or destination groups.
    const highestNode = sourceStateObjs[highestNodeId] || destinationStateObjs[highestNodeId];
    const lowestNode = sourceStateObjs[lowestNodeId] || destinationStateObjs[lowestNodeId];

    // With this computed data, we can update state with the proper values for the center line.
    return {
      centerLine: {
        midPoint: centerLineMidPoint,
        top: highestNode.y + (highestNode.height / 2) + graphPadding,
        bottom: lowestNode.y + (lowestNode.height / 2) + graphPadding
      },
      nodeLineLength: nodeLineLength
    };
  }

  static computeColumnsLayout(
    sourcesSVGGroupRef,
    destinationsSVGGroupRef,
    sourcesOffset,
    destinationsOffset,
    graphPadding,
    svgContainer
  ) {
    // Get the bounding boxes of the groups surrounding the source and destination nodes.
    const sourcesSVGGroupRefBBox = sourcesSVGGroupRef.getBBox();
    const destsGroupBBox = destinationsSVGGroupRef.getBBox();

    // Calculate the desired offset of the destination column based on the width of the SVG.
    // No need to calculate for the source column - its horizontal offset is effectively 0.
    const destColumnXOffset = svgContainer.getBoundingClientRect().width - destsGroupBBox.width;

    // The state object will be updated differently depending on whether the source or destination column is taller.
    let newState;
    if (sourcesSVGGroupRefBBox.height > destsGroupBBox.height) {
      newState = {
        destinationsOffset: {
          y: ((sourcesSVGGroupRefBBox.height / 2) - (destsGroupBBox.height / 2)) + graphPadding,
          x: destColumnXOffset - graphPadding
        }
      };

    } else if (sourcesSVGGroupRefBBox.height <= destsGroupBBox.height) {
      newState = {
        sourcesOffset: {
          x: sourcesOffset.x,
          y: ((destsGroupBBox.height / 2) - (sourcesSVGGroupRefBBox.height / 2)) + graphPadding
        },
        destinationsOffset: {
          x: destColumnXOffset - graphPadding,
          y: destinationsOffset.y
        }
      };
    }

    return newState;
  }

  // Once popover is displayed, align it based on the node.
  static computePopoverLayout(
    sourcesOffset,
    destinationsOffset,
    node,
    isSourceNode,
    popoverTextNode,
    graphPadding,
    vizHeight
  ) {
    const popoverWidth = popoverTextNode.getBBox().width + 10;
    const xColumnOffset = (popoverWidth > node.width) ? -(popoverWidth - node.width) : (node.width - popoverWidth) / 2;

    // Calculate the x and y offset for the popover. Align left for source nodes and right for destination nodes
    const x = isSourceNode ? graphPadding : (destinationsOffset.x + xColumnOffset);
    let y = (isSourceNode ? sourcesOffset.y : destinationsOffset.y) + node.y + node.height + 10;

    // If the popover would render off the bottom of the visualization, it must be in a flipped orientation.
    const isFlippedOrientation = (y + 30) > vizHeight;

    // If the popover is in a flipped orientation, it needs to be moved above the target node.
    if (isFlippedOrientation) {
      y -= (node.height + 45);
    }

    return {
      popover: {
        x: x,
        y: y,
        width: popoverWidth,
        content: node.name,
        visible: true,
        isSourcePopover: isSourceNode,
        isFlippedPopover: isFlippedOrientation
      }
    };
  }

  static computeNodeLineLayout(
    node,
    isSourceNode,
    horizPillPadding,
    vertPillPadding,
    normalTextHeight,
    isFullConnector,
    sourcesOffset,
    destinationsOffset,
    centerLine
  ) {

    // If this line is for a source node, the line ends at the centerlines horizontal position, which can be
    // calculated by taking the global centerline horizontal position, and subtracting off the horizontal offset of
    // the source column and the width of the node.

    // If this line is for a destination node, the line's end can be calculated by taking the horizontal offset of
    // the destinations column and subtracting off the position of the midpoint.
    const computeX2 = (x1) => {

      if ((!isSourceNode && !isFullConnector) || (isSourceNode && isFullConnector)) {
        return destinationsOffset.x;
      } else if (isSourceNode) {
        return centerLine.midPoint;
      } else {
        return x1;
      }
    };

    // The y offset of a line for a node is the node's y value, plus half the nodes height,
    // plus the y offset of the column to which the node belongs.
    const yOffset = node.y + (node.height / 2) + (
      isSourceNode ?
        sourcesOffset.y :
        destinationsOffset.y
    );

    // If this is a source node, the line starts at the offset of the sources group, plus the node's width
    // If it is a destination node, the line start starts at the center lines horizontal position
    const x1 = isSourceNode ?
      node.width + sourcesOffset.x :
      centerLine.midPoint;

    const x2 = computeX2(x1);

    const length = x2 - x1;

    // Check if this node represents multiple aliquots
    const isMultiAliquot = node.aliquots > 1;

    // Define a constant for the width of the subtitle `per well`.
    // This is a bit hacky but prevents another setState and render
    const subtitleWidth = 41;

    // Check if the subtitle string of `per well` is wider that the rendered width of the
    // volume rendered in the pill for this line
    const subtitleIsWider = isMultiAliquot && (node.volumeWidth < subtitleWidth);

    // If the subtitle is wider, the total text width is the width of the subtitle.
    // Otherwise it's the width of the volume string
    const totalTextWidth = subtitleIsWider ? subtitleWidth : node.volumeWidth;

    // Calculate the total width of the volume pill
    const volumePillWidth = totalTextWidth + (horizPillPadding * 2);

    // Calculate the horizontal offset of the volume pill by subtracting the pill's width from the position of the
    // end of the line and dividing this difference by two.
    const volumePillHorizOffset = (length - volumePillWidth) / 2;

    // Calculate the x offset necessary to center the subtitle string given the width of the subtitle string
    const subtitleHorizOffset = (volumePillWidth - subtitleWidth) / 2;

    // Calculate the x offset for the volume string given the width of the volume string
    const volumeTextHorizOffset = (volumePillWidth - node.volumeWidth) / 2;

    // If the line connects a node with multiple aliquots, the volume pill must be taller to accomodate the subtitle
    const volumePillHeight = isMultiAliquot ? 37 : 22;
    // Later, we will center the volume pill on the line by moving it up by half its height
    const volumePillVertOffset = -volumePillHeight / 2;

    // Define the height of the volume text and then offset the subtitle appropriately using it
    const volumeTextSize = normalTextHeight;
    const subtitleVertOffset = vertPillPadding + volumeTextSize + 4;

    return {
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
    };
  }

  // Check if the graph being rendered has a single source and destination each of a single aliquot
  static isGraphOneToOne(data) {
    if (
      (data.edges.length === 1) &&
      (data.sources[data.edges[0].source].aliquots === 1) &&
      (data.destinations[data.edges[0].destination].aliquots === 1)
    ) {
      return true;
    }

    return false;
  }

  static setupDefaultStateObjects(nodesObj, nodeWidth, colors) {
    const nodeObjPrime = nodesObj;

    // Iterate over the nodes and assign additional, initial keys to each.
    Object.keys(nodeObjPrime).forEach((nodeId) => {
      nodeObjPrime[nodeId].x = 0;
      nodeObjPrime[nodeId].y = 0;
      nodeObjPrime[nodeId].height = (nodeObjPrime[nodeId].aliquots > 1) ? 45 : 30;
      nodeObjPrime[nodeId].width = nodeWidth || 150;
      nodeObjPrime[nodeId].volumeWidth = 0;

      // Use the container ID provided in props data to assign a color from the color scale to this container, if one
      // was provided in the data. If one was provided, use it instead.
      nodeObjPrime[nodeId].color = nodeObjPrime[nodeId].color || colors[nodeObjPrime[nodeId].containerId];
    });

    return nodeObjPrime;
  }
}

export default LayoutUtils;
