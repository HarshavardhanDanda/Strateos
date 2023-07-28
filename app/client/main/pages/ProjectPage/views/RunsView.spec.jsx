import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import Immutable from 'immutable';
import sinon from 'sinon';
import RunsView from './RunsView';

const project = () => {
  return {
    id: 'p18qj7p6crwx3',
    name: 'release-20-6-1'
  };
};

const getRuns = () => {
  return [
    {
      id: 'r1ehezhnmykpf8',
      title: 'Test1',
      status: 'rejected',
      reject_reason: 'invalid requirements',
      reject_description: 'testing',
      created_at: '2021-04-28 13:27:41.786944',
      test_mode: false
    },
    {
      id: 'r1ehezhnmykpf6',
      title: 'Test2',
      status: 'rejected',
      reject_reason: 'invalid requirements',
      reject_description: 'testing',
      created_at: '2021-04-28 13:27:41.786944',
      test_mode: false
    },
    {
      id: 'r1ehezhnmykpf6',
      title: 'Test3',
      status: 'pending',
      created_at: '2021-04-28 13:27:41.786944',
      test_mode: false
    }
  ];
};

const props = {
  project: Immutable.Map(project()),
  runs: Immutable.fromJS(getRuns()),
  match: {
    params: {
      subdomain: 'transcriptic'
    }
  }
};

describe('Runs View', () => {
  let wrapper;

  const sandbox = sinon.createSandbox();

  beforeEach(() => {
    wrapper =  shallow(<RunsView {...props} />);
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
    sandbox.restore();
  });

  it('should render Rejected runs section if runs contains rejected status', () => {
    expect(wrapper.dive().find('RunListSection').at(1).props().titleNode.props.children).to.be.eql('Rejected Runs (2)');
  });

  it('should render reject reason and description in rejected run card', () => {
    expect(wrapper.dive().find('RunListSection').at(1).props().titleNode.props.children).to.be.eql('Rejected Runs (2)');
    const run = wrapper.dive().find('RunListSection').at(1).dive()
      .find('RunList')
      .dive()
      .find('ConnectedRunCard')
      .at(0)
      .props().run;
    expect('invalid requirements').to.be.eql(run.get('reject_reason'));
    expect('testing').to.be.eql(run.get('reject_description'));
  });

  it('should render pending runs in scheduled runs section', () => {
    expect(wrapper.dive().find('RunListSection').at(0).props().titleNode.props.children).to.be.eql('Scheduled Runs (1)');
    const run = wrapper.dive().find('RunListSection').at(0).dive()
      .find('RunList')
      .dive()
      .find('ConnectedRunCard')
      .at(0)
      .props().run;
    expect('pending').to.be.eql(run.get('status'));
  });
});
