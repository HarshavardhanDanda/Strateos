import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';
import sinon from 'sinon';

import InstructionsAPI from 'main/api/InstructionAPI';
import TaskGraphDataProviderHOC from './TaskGraphDataProvider';

describe('TaskGraphDataProvider', () => {
  const sandbox = sinon.createSandbox();
  const props = {
    projectId: 'projectId',
    runId: 'runId'
  };
  let instructionsAPIStub;
  let wrapper;

  afterEach(() => {
    if (wrapper) wrapper.unmount();
    if (sandbox) sandbox.restore();
  });

  beforeEach(() => {
    instructionsAPIStub = sandbox.stub(InstructionsAPI, 'fetchAllForRun').returns({
      then: (cb) => {
        cb({ data: [] });
        return { fail: (cb) => { cb(); } };
      }
    });
  });

  it('should re-fetch instructions when run id is changed', () => {
    wrapper = shallow(<TaskGraphDataProviderHOC {...props} />);
    const taskGraphDataProvider = wrapper.find('TaskGraphDataProvider').dive();
    expect(instructionsAPIStub.calledOnce).to.be.true;
    taskGraphDataProvider.setProps({ ...props, runId: 'runId1' });
    expect(instructionsAPIStub.calledTwice).to.be.true;
  });

  it('should not re-fetch runs details when run id is not changed', () => {
    wrapper = shallow(<TaskGraphDataProviderHOC {...props} />);
    const taskGraphDataProvider = wrapper.find('TaskGraphDataProvider').dive();
    expect(instructionsAPIStub.calledOnce).to.be.true;
    taskGraphDataProvider.setProps({ ...props, runId: 'runId' });
    expect(instructionsAPIStub.calledOnce).to.be.true;
  });
});
