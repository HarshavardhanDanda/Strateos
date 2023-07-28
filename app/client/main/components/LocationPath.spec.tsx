import React from 'react';
import Immutable from 'immutable';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import { HierarchyPath } from '@transcriptic/amino';

import LocationPath from './LocationPath';

const testContainerId = '123foo';
const testPosition = 1;
const testAncestors = Immutable.fromJS([{ name: 'ancestor-name1', id: 'loc123' }]);
const testLocation = Immutable.fromJS({ ancestors: testAncestors, name: 'location-name', id: 'loc345' });

describe('LocationPath', () => {
  it('renders', () => {
    const wrapper = shallow(<LocationPath location={testLocation} containerId={testContainerId} position={testPosition} />);
    wrapper.unmount();
  });

  it('renders a HierarchyPath with one ancestor', () => {
    const wrapper = shallow(<LocationPath location={testLocation} containerId={testContainerId} position={testPosition} />);
    const hierarchyPaths = wrapper.find(HierarchyPath);
    expect(hierarchyPaths).to.have.length(1);
    const hierarchyPath = hierarchyPaths.at(0);
    expect(hierarchyPath.props().steps).to.have.length(2); // location plus one ancestor
    wrapper.unmount();
  });

  it('renders a HierarchyPath with no ancestors', () => {
    const location = testLocation.set('ancestors', Immutable.List()); // remove ancestors
    const wrapper = shallow(<LocationPath location={location} containerId={testContainerId} position={testPosition} />);
    const hierarchyPaths = wrapper.find(HierarchyPath);
    const hierarchyPath = hierarchyPaths.at(0);
    expect(hierarchyPath.props().steps).to.have.length(1); // just the location
    wrapper.unmount();
  });
});
