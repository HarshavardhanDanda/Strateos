import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';
import sinon from 'sinon';
import Immutable from 'immutable';

import LocationTree from './LocationTree';

const locations = Immutable.fromJS([
  {
    ancestors: [],
    col: null,
    location_type: {
      id: 'loctyp1egnd6qa5z8g2',
      name: 'Region',
      category: 'region',
      capacity: null,
      created_at: '2021-01-09T20:57:51.361-08:00',
      updated_at: '2021-01-09T20:57:51.361-08:00',
      location_type_categories: [
        ''
      ]
    },
    merged_properties: {},
    position: null,
    created_at: '2020-06-01T13:52:26.042-07:00',
    name: '📋 Test Region',
    lab_id: 'lb1fknzm4k8qkq7',
    parent_id: null,
    properties: {},
    updated_at: '2021-03-23T20:36:35.629-07:00',
    row: null,
    parent_path: [],
    id: 'loc1egneyc9dd5yu'
  },
  {
    ancestors: [
      {
        id: 'loc1egneyc9dd5yu',
        parent_id: null,
        name: '📋 Test Region',
        position: null,
        human_path: '📋 Test Region',
        ancestor_blacklist: []
      }
    ],
    col: null,
    location_type: {
      id: 'loctyp1959vuy4482f',
      name: 'Unknown',
      category: 'Unknown',
      capacity: null,
      created_at: '2016-06-21T16:30:16.096-07:00',
      updated_at: '2016-07-18T19:41:00.006-07:00',
      location_type_categories: []
    },
    merged_properties: {
      environment: 'ambient'
    },
    position: null,
    created_at: '2019-09-03T12:07:01.542-07:00',
    name: "[Test] Elvis' desk",
    lab_id: 'lb1fknzm4k8qkq7',
    parent_id: 'loc1egneyc9dd5yu',
    properties: {
      environment: 'ambient'
    },
    updated_at: '2020-06-01T14:35:02.815-07:00',
    row: null,
    parent_path: [
      'loc1egneyc9dd5yu'
    ],
    id: 'loc1dhk6eswmjhbk'
  },
]);

const nodeState = Immutable.fromJS({
  null: {
    isOpen: true
  },
  undefined: {
    isBusy: false
  },
  loc1egneyc9dd5yu: {
    isOpen: true
  },
  loc1dhk6eswmjhbk: {
    isSelected: true
  }
});

describe('LocationTree', () => {
  const sandbox = sinon.createSandbox();
  let wrapper;

  afterEach(() => {
    wrapper.unmount();
    sandbox.restore();
  });

  it('should render without any errors', () => {
    wrapper = shallow(<LocationTree locations={locations} nodeState={nodeState} onOpen={() => {}} onSelect={() => {}} />);
    expect(wrapper.find('div').at('0').props().className).to.equal('location-tree');
  });

  it('should build hierarchy tree node object', () => {
    const onOpen = sandbox.spy();
    wrapper = shallow(<LocationTree locations={locations} nodeState={nodeState} onOpen={onOpen} onSelect={() => {}} />);
    expect(wrapper.find('HierarchyTree').props().node.toJS()).to.deep.equal({
      id: null,
      value: 'Locations',
      isRoot: true,
      isOpen: true,
      children: [
        {
          id: 'loc1egneyc9dd5yu',
          value: '📋 Test Region',
          isOpen: true,
          path: ['children', 0],
          children: [
            {
              id: 'loc1dhk6eswmjhbk',
              value: "[Test] Elvis' desk",
              isSelected: true,
              path: ['children', 0, 'children', 0],
              children: []
            }
          ]
        }
      ]
    });
  });
});
