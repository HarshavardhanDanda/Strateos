import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';
import sinon from 'sinon';
import Immutable from 'immutable';

import RunStore from 'main/stores/RunStore';
import RunTransferModal from './RunTransferModal';
import TransferModal from './TransferModal';

describe('RunTransferModal', () => {
  const sandbox = sinon.createSandbox();
  let wrapper;

  const runWithTitle = Immutable.fromJS(
    {
      id: 'r1eap9u46fgh42',
      title: 'test run'
    }
  );

  const runWithOutTitle = Immutable.fromJS(
    {
      id: 'r1eap9u46fghgm',
      title: null
    }
  );

  beforeEach(() => {
    const runStoreStub = sandbox.stub(RunStore, 'getById');
    runStoreStub.withArgs(runWithTitle.get('id')).returns(runWithTitle);
    runStoreStub.withArgs(runWithOutTitle.get('id')).returns(runWithOutTitle);
  });

  afterEach(() => {
    wrapper.unmount();
    sandbox.restore();
  });

  it('should display description for run with a title', () => {
    const runID = runWithTitle.get('id');
    const runTitle = runWithTitle.get('title');
    wrapper = shallow(<RunTransferModal selection={[runID]} />);
    expect(wrapper.find(TransferModal).prop('selectionDescription')).to.equal(runTitle);
  });

  it('should display description for run without a title', () => {
    const runID = runWithOutTitle.get('id');
    const runTitle = `Run ${runID}`;
    wrapper = shallow(<RunTransferModal selection={[runID]} />);
    expect(wrapper.find(TransferModal).prop('selectionDescription')).to.equal(runTitle);
  });

  it('should display description for multiple runs', () => {
    const runIds = [runWithTitle.get('id'), runWithOutTitle.get('id')];
    wrapper = shallow(<RunTransferModal selection={runIds} />);
    expect(wrapper.find(TransferModal).prop('selectionDescription')).to.equal('test run, Run r1eap9u46fghgm');
  });
});
