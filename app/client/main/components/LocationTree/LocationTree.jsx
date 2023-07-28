import Immutable from 'immutable';
import _         from 'lodash';
import PropTypes from 'prop-types';
import React     from 'react';

import LocationUtil from 'main/util/LocationUtil';
import { HierarchyTree, HierarchyTreeLogic } from '@transcriptic/amino';

class LocationTree extends React.PureComponent {

  static get propTypes() {
    return {
      locations:    PropTypes.instanceOf(Immutable.Iterable),
      nodeState:    PropTypes.instanceOf(Immutable.Map), // locationId -> (isOpen, isSelected, etc)
      onOpen:       PropTypes.func.isRequired,
      onSelect:     PropTypes.func.isRequired,
      isSelectDeep: PropTypes.bool
    };
  }

  static get defaultProps() {
    return {
      locations: Immutable.List(),
      nodeState: Immutable.Map()
    };
  }

  getLocationId(node) {
    return node.get('id');
  }

  rootNode(nodeState) {
    // must use null for id here instead of undefined
    let rootState = nodeState.get(null, Immutable.Map()); // eslint-disable-line

    if (!rootState.has('isOpen')) {
      // default to having the root open.
      rootState = rootState.set('isOpen', true);
    }

    const root = Immutable.fromJS({
      id: null, // eslint-disable-line
      value: 'Locations',
      isRoot: true,
      children: []
    });

    return root.merge(rootState);
  }

  locationToNode(location) {
    const name = _.isEmpty(location.get('name')) ? '-' : location.get('name');

    return Immutable.fromJS({
      value: name,
      id: location.get('id')
    });
  }

  buildHierarchyNode(locations, nodeState) {
    // Don't render the individual cells of a tube box (we display the entire box as a 2D representation)
    const locationsWithoutCells = locations.filter((location) => {
      const ltype = location.get('location_type');
      return ltype && ltype.get('category') !== LocationUtil.categories.box_cell;
    });

    const locationsByParent = locationsWithoutCells.groupBy(location =>
      location.get('parent_id')
    );

    let hierarchyNode = this.rootNode(nodeState);

    // queue of [parent_id, path] that we need to process and add their children
    const parentsToProcess = [[null, Immutable.List()]]; // eslint-disable-line

    // function to process each parent in queue.
    const processParent = (location, parentPath, index) => {
      const locationId = location.get('id');
      const childState = nodeState.get(locationId, Immutable.Map());
      const node       = this.locationToNode(location).merge(childState);
      const path       = parentPath.push('children', index);
      hierarchyNode    = hierarchyNode.setIn(path.toJS(), node);

      parentsToProcess.push([locationId, path]);
    };

    // Create the node top down, starting from the root, and in breadth
    // first order add the children.
    while (parentsToProcess.length !== 0) {
      const [parentId, parentPath] = parentsToProcess.shift();
      const children               = locationsByParent.get(parentId, Immutable.List());

      children.forEach((c, index) => processParent(c, parentPath, index));
    }

    return HierarchyTreeLogic.sortBy(hierarchyNode, 'value');
  }

  render() {
    return (
      <div className="location-tree">
        <HierarchyTree
          node={this.buildHierarchyNode(this.props.locations, this.props.nodeState)}
          onSelect={(nodePath, node) => this.props.onSelect(this.getLocationId(node))}
          onOpen={(nodePath, node) => this.props.onOpen(this.getLocationId(node))}
          isSelectDeep={this.props.isSelectDeep}
        />
      </div>
    );
  }
}

export default LocationTree;
