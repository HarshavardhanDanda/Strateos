import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';
import * as dagre from 'dagre';
import sinon from 'sinon';
import Immutable from 'immutable';

import TaskGraph from './TaskGraph';

describe('TaskGraph', () => {
  const sandbox = sinon.createSandbox();
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setGraph({ rankdir: 'LR' });
  const props = {
    taskGraph: Immutable.Map({ timeConstraints: Immutable.Iterable() }),
    dagreGraph: dagreGraph,
    chartDimensions: {
      width: 200,
      height: 400
    },
    refColors: Immutable.Map({}),
    highlightedTaskIds: Immutable.Set([]),
    onClickTask: () => {},
    completionStatuses: Immutable.Map({})
  };
  let wrapper;

  afterEach(() => {
    if (wrapper) wrapper.unmount();
    if (sandbox) sandbox.restore();
  });

  it('should log error when rankdir is not LR (Left - Right)', () => {
    const consoleSpy = sandbox.stub(console, 'error');
    wrapper = shallow(<TaskGraph {...props} />);
    console.log(consoleSpy.args);
    expect(consoleSpy.calledOnce).to.be.true;
    expect(consoleSpy.args[0][0]).equals('dagre Graph must have orientation RL (Right - Left). Instead it was LR');
  });

  it('should not log error when rankdir is RL (Right - Left)', () => {
    dagreGraph.setGraph({ rankdir: 'RL' });
    const consoleSpy = sandbox.stub(console, 'error');
    wrapper = shallow(<TaskGraph {...props} />);
    expect(consoleSpy.calledOnce).to.be.false;
  });
});
