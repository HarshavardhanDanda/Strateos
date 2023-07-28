import React from 'react';
import { shallow, mount } from 'enzyme';
import { expect } from 'chai';
import sinon from 'sinon';
import { BrowserRouter as Router } from 'react-router-dom';
import Immutable from 'immutable';

import FeatureStore         from 'main/stores/FeatureStore';
import FeatureConstants     from '@strateos/features';
import LabConsumerActions from 'main/actions/LabConsumerActions';
import LabConsumerStore from 'main/stores/LabConsumerStore';
import labConsumerData from 'main/test/labconsumer/testData.json';
import SessionStore from 'main/stores/SessionStore';
import ReactionPageSummary, { submitReactionDisabledToolTip } from './ReactionPageSummary';

import RunLink from './RunLink';
import * as APIMock from './ChemicalReactionAPIMock';
import ServiceMock from './ReactionAPIServiceMock';
import SubmitButton from './SubmitButton';
import MaterialComponent from './MaterialComponent';

const serviceMock = new ServiceMock();

describe('ReactionPageSummary', () => {
  const sandbox = sinon.createSandbox();

  const mockLabConsumers = Immutable.fromJS([labConsumerData[0]]);

  const dataWithRunAndProject = {
    ...APIMock.reactionWithRunCreated,
    runId: 'fake-run-id',
    projectId: 'fake-project-id'
  };

  const props = {
    reactionAPI: serviceMock,
    reaction: dataWithRunAndProject,
    setActiveStepIndex: () => {},
    setIsSubmitting: () => {},
    isMaterialResolved: () => true,
    isFetchingUpdatedReaction: false,
    polling: false,
    setPolling: () => {}
  };

  beforeEach(() => {
    sandbox.stub(LabConsumerActions, 'loadLabsForCurrentOrg').returns({ done: (cb) => cb() });
    sandbox.stub(LabConsumerStore, 'getAllForCurrentOrg').returns(mockLabConsumers);
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.Map({ id: 'org123' }));
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should pass correct labId to material component', () => {
    const wrapper = mount(
      <Router>
        <ReactionPageSummary
          {...props}
        />
      </Router>
    );
    expect(wrapper.find(MaterialComponent).props().labId).to.equal('lab1');
  });

  it('renders a RunLink without run or project id', () => {
    const dataWithoutRunOrProject = {
      ...APIMock.reactionWithRunCreated,
      runId: undefined,
      projectId: undefined
    };
    const wrapper = shallow(<ReactionPageSummary {...props} reaction={dataWithoutRunOrProject} />);
    const runLink = wrapper.find(RunLink);
    expect(runLink.length).to.equal(1);
    expect(runLink.props().runId).to.equal(undefined);
    expect(runLink.props().projectId).to.equal(undefined);
    wrapper.unmount();
  });

  it('renders a RunLink when reaction has a project and run', () => {
    const wrapper = shallow(<ReactionPageSummary {...props} />);

    const runLink = wrapper.find(RunLink);
    expect(runLink.length).to.equal(1);
    expect(runLink.props().runId).to.equal('fake-run-id');
    expect(runLink.props().projectId).to.equal('fake-project-id');
    wrapper.unmount();
  });

  it('submit button is disabled if user missing EDIT_SUBMIT_REACTION feature code', () => {
    sandbox.stub(FeatureStore, 'hasFeature').withArgs(FeatureConstants.EDIT_SUBMIT_REACTION).returns(false);
    const wrapper = shallow(<ReactionPageSummary {...props} />);

    const submitButton = wrapper.find(SubmitButton);
    expect(submitButton.at(0).props().disabled).to.equal(true);
    expect(submitButton.at(0).props().label).to.equal(submitReactionDisabledToolTip);
    wrapper.unmount();
  });

  it('submit button is enabled if user has EDIT_SUBMIT_REACTION feature code', () => {
    const dataWithProjectAndResources = {
      ...APIMock.reactionCreated,
      projectId: 'fake-project-id',
      batch: {},
    };
    sandbox.stub(FeatureStore, 'hasFeature').withArgs(FeatureConstants.EDIT_SUBMIT_REACTION).returns(true);
    const wrapper = shallow(<ReactionPageSummary {...props} reaction={dataWithProjectAndResources} />);

    const submitButton = wrapper.find(SubmitButton);
    expect(submitButton.at(0).props().disabled).to.equal(false);
    wrapper.unmount();
  });

  it('Back button sets active step index to 0', () => {

    const setActiveStepIndex = sinon.spy();
    const wrapper = shallow(<ReactionPageSummary {...props} setActiveStepIndex={setActiveStepIndex} />);

    const backButton = wrapper.find('Button').at(1).dive();
    expect(backButton.text()).to.equal('Back');
    backButton.simulate('click');
    expect(setActiveStepIndex.calledOnce).to.equal(true);
    expect(setActiveStepIndex.alwaysCalledWith(0)).to.equal(true);
  });
});
