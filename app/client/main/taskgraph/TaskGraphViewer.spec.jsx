import React from 'react';
import { expect } from 'chai';
import { mount } from 'enzyme';
import Immutable from 'immutable';

import generateTaskGraph from 'main/taskgraph/component/utils/GenerateTaskGraphUtil';
import TaskGraphViewer from './TaskGraphViewer';

describe('TaskGraphViewer', () => {
  let wrapper;
  const props = {
    run: Immutable.fromJS({
      id: 'run1',
      autoprotocol: {
        instructions: [
          {
            op: 'incubate',
            object: 'a1-2',
            where: 'cold_4',
            duration: '5:minute',
            shaking: false,
            co2_percent: 0
          }
        ],
        refs: {
          'a1-2': {
            id: 'ct1dmz8k9zzuz5u',
            store: {
              where: 'cold_4'
            }
          }
        }
      },
    }),
    refColors: Immutable.Map({})
  };

  afterEach(() => {
    if (wrapper) wrapper.unmount();
  });

  it('should render with correct graph data', () => {
    wrapper = mount(<TaskGraphViewer {...props} />);
    const taskGraph = generateTaskGraph(props.run);
    const highlightedTaskIds = [
      'run1|FetchTask|a1-2',
      'run1|InstructionTask|0',
      'run1|DestinyTask|a1-2'
    ];

    expect(wrapper.find('TaskDetailPanel').props().taskGraph).deep.equals(taskGraph);
    expect(wrapper.find('TaskGraph').props().taskGraph).deep.equals(taskGraph);
    expect(wrapper.find('TaskGraph').props().highlightedTaskIds.toJS()).deep.equals(highlightedTaskIds);
  });

  it('should have gray as TabLayout background color', () => {
    wrapper = mount(<TaskGraphViewer {...props} />);
    const tabLayout = wrapper.find('TabLayout');

    expect(tabLayout.length).to.equals(1);
    expect(tabLayout.props().theme).to.equals('gray');
  });
});
