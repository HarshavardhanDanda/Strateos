import React from 'react';
import { mount, shallow } from 'enzyme';
import sinon from 'sinon';
import { expect } from 'chai';

import rootNode from 'main/state/rootNode';
import Immutable from 'immutable';
import RootNodeDebugger from './RootNodeDebugger';

describe('RootNodeDebugger', () => {

  let wrapper;
  let updateNodePathStub;
  const sandbox = sinon.createSandbox();
  const node = rootNode.sub('session', Immutable.Map());

  const props = {
    rootNode: node
  };

  afterEach(() => {
    if (wrapper) wrapper.unmount();
    sandbox.restore();
  });

  it('should render without errors', () => {
    wrapper = shallow(<RootNodeDebugger {...props} />);
  });

  it('should update nodePath when state is changed', () => {
    wrapper = mount(<RootNodeDebugger {...props} />);
    const rootNodeDebugger = wrapper.find('RootNodeDebugger');
    updateNodePathStub = sandbox.stub(rootNodeDebugger.instance(), 'update');
    expect(updateNodePathStub.called).to.be.false;
    rootNodeDebugger.instance().toggle({ altKey: true, which: 'S'.charCodeAt(0) });
    expect(updateNodePathStub.calledTwice).to.be.true;
  });

  it('should not update nodePath when state is not changed', () => {
    wrapper = mount(<RootNodeDebugger {...props} />);
    const rootNodeDebugger = wrapper.find('RootNodeDebugger');
    updateNodePathStub = sandbox.stub(rootNodeDebugger.instance(), 'update');
    expect(updateNodePathStub.called).to.be.false;
    rootNodeDebugger.instance().toggle({ altKey: false, which: 'S'.charCodeAt(0) });
    expect(updateNodePathStub.called).to.be.false;
  });
});
