import React from 'react';
import Immutable from 'immutable';
import { BrowserRouter } from 'react-router-dom';
import { mount } from 'enzyme';
import sinon from 'sinon';
import { expect } from 'chai';

import { Spinner } from '@transcriptic/amino';

import LaunchRequestAPI from 'main/api/LaunchRequestAPI';
import ProjectStore from 'main/stores/ProjectStore';
import ProtocolStore from 'main/stores/ProtocolStore';
import SessionStore from 'main/stores/SessionStore';
import LabConsumerStore    from 'main/stores/LabConsumerStore';
import LabConsumerActions  from 'main/actions/LabConsumerActions';
import ContextualCustomPropertiesConfigActions     from 'main/actions/ContextualCustomPropertiesConfigActions';
import ContextualCustomPropertyConfigStore       from 'main/stores/ContextualCustomPropertyConfigStore';
import testProtocol from 'main/test/protocol.json';
import RunLaunchPage from './index';
import LaunchRun from './LaunchRun';

const defaultProps = {
  match: {
    params: {
      protocolId: 'pr123',
      projectId: 'p345'
    }
  },
  location: {
    search: ''
  }
};

const organization = {
  id: 'org13',
  name: 'Strateos'
};

const project = {
  id: 'p123',
  name: 'some project name',
  organization_id: 'org13',
  bsl: 1,
  organization: { id: 'org13', name: 'Strateos' }
};

const protocol = {
  ...testProtocol,
  id: 'p123',
  inputs: { // Required to make LaunchRunSequence render
    foo: {
      type: 'string'
    }
  }
};

describe('RunLaunchPage', () => {
  const sandbox = sinon.createSandbox();
  let wrapper;
  let projectStub;
  let protocolStub;

  beforeEach(() => {
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.fromJS(organization));
    sandbox.stub(ContextualCustomPropertiesConfigActions, 'loadConfig');
    sandbox.stub(ContextualCustomPropertyConfigStore, 'loadCustomPropertiesConfig');
    projectStub = sandbox.stub(ProjectStore, 'getById').returns(Immutable.fromJS(project));
    // Required to make LaunchRunSequence render
    protocolStub = sandbox.stub(ProtocolStore, 'getById').withArgs('pr123').returns(Immutable.fromJS(protocol));
    sandbox.stub(LabConsumerActions, 'loadLabsForCurrentOrg').returns({ done: (cb) => {
      cb();
    } });
    sandbox.stub(LabConsumerStore, 'first').returns(Immutable.Map({ lab_id: 'lb123' }));
  });

  afterEach(() => {
    sandbox.restore();
    if (wrapper) {
      wrapper.unmount();
    }
  });

  it('renders empty without throwing', () => {
    wrapper = mount(
      <BrowserRouter>
        <RunLaunchPage {...defaultProps} />
      </BrowserRouter>
    );
  });

  it('renders a spinner if it doesnt have a protocol or project', () => {
    const props = {
      match: {
        params: {
          protocolId: 'notinthestore',
          projectId: 'notinthestore'
        }
      },
      location: {
        search: ''
      }
    };
    wrapper = mount(
      <BrowserRouter>
        <RunLaunchPage {...props} />
      </BrowserRouter>
    );
    expect(wrapper.find(Spinner).length).to.be.greaterThan(0);
  });

  it('renders a spinner if it doesnt have a protocol or project or launchrequest', () => {
    const props = {
      match: {
        params: {
          protocolId: 'notinthestore',
          projectId: 'notinthestore'
        }
      },
      location: {
        search: '?launch_request_id=lr123'
      }
    };

    // setup protocol and project data, but no launch request data
    protocolStub.returns(Immutable.fromJS({ id: 'pr123' }));

    wrapper = mount(
      <BrowserRouter>
        <RunLaunchPage {...props} />
      </BrowserRouter>);
    expect(wrapper.find(Spinner).length).to.be.greaterThan(0);
  });

  it('renders the launch run sequence when it has a protocol and project', () => {
    wrapper = mount(
      <BrowserRouter>
        <RunLaunchPage {...defaultProps} />
      </BrowserRouter>
    );
    expect(wrapper.find(LaunchRun).length).to.be.greaterThan(0);
  });

  it('fetches a launch request if provided in the url', () => {
    const propsWithGoodLaunchRequest = {
      match: {
        params: {
          protocolId: 'pr123',
          projectId: 'p345'
        }
      },
      location: {
        search: '?launch_request_id=lr123'
      }
    };
    sandbox.spy(LaunchRequestAPI, 'get');
    wrapper = mount(
      <BrowserRouter>
        <RunLaunchPage {...propsWithGoodLaunchRequest} />
      </BrowserRouter>
    );
    expect(LaunchRequestAPI.get.args[0][0]).to.equal('lr123');
  });

  it('should set page header as primary type by default', () => {
    wrapper = mount(
      <BrowserRouter>
        <RunLaunchPage {...defaultProps} />
      </BrowserRouter>
    );
    const pageHeader = wrapper.find('ConnectedRunLaunchPage').find('RunLaunchPage').find('PageLayout')
      .props().PageHeader;
    expect(pageHeader.props.type).to.equal('primary');
    expect(pageHeader.props.primaryInfoArea).to.equal(undefined);
  });

  it('should indicate when project is an implementation project', () => {
    projectStub.returns(Immutable.fromJS({ ...project, is_implementation: true }));
    wrapper = mount(
      <BrowserRouter>
        <RunLaunchPage {...defaultProps} />
      </BrowserRouter>
    );
    const page = wrapper.find('ConnectedRunLaunchPage').find('RunLaunchPage');
    const pageHeader = page.find('PageLayout').props().PageHeader;
    const mountedPrimaryInfoArea = mount(pageHeader.props.primaryInfoArea);
    expect(pageHeader.props.type).to.equal('brand');
    expect(mountedPrimaryInfoArea.find('ImplementationProjectIndicator').length).to.equal(1);
    expect(mountedPrimaryInfoArea.find('ImplementationProjectIndicator').props().organizationName).to.equal('Strateos');
    mountedPrimaryInfoArea.unmount();
  });
});
