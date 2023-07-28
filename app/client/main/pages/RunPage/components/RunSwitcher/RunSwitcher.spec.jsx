import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';
import sinon from 'sinon';

import RunAPI from 'main/api/RunAPI';
import RunSwitcher from './index';

describe('RunSwitcher', () => {
  const sandbox = sinon.createSandbox();
  const props = {
    projectId: 'projectId',
    runTitle: () => {},
    activeTitle: 'active-title',
    currentRunId: 'runId'
  };
  let runAPIStub;
  let wrapper;

  afterEach(() => {
    if (wrapper) wrapper.unmount();
    if (sandbox) sandbox.restore();
  });

  beforeEach(() => {
    runAPIStub = sandbox.stub(RunAPI, 'index').returns({
      then: (cb) => { cb({ data: [] }); }
    });
    wrapper = shallow(<RunSwitcher {...props} />);
  });

  it('should re-fetch runs details when project id is changed', () => {
    expect(runAPIStub.calledOnce).to.be.true;
    wrapper.setProps({ ...props, projectId: 'projectId1' });
    expect(runAPIStub.calledTwice).to.be.true;
  });

  it('should not re-fetch runs details when project id is not changed', () => {
    expect(runAPIStub.calledOnce).to.be.true;
    wrapper.setProps({ ...props, projectId: 'projectId' });
    expect(runAPIStub.calledOnce).to.be.true;
  });
});
