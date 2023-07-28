import React from 'react';
import Immutable from 'immutable';
import { shallow } from 'enzyme';
import { expect } from 'chai';
import sinon from 'sinon';

import { Card } from '@transcriptic/amino';
import WorkflowStore from 'main/stores/WorkflowStore';

import AcsControls from 'main/util/AcsControls';
import Urls from 'main/util/urls';
import * as client from 'main/util/graphql/client';
import { getMockGqlClient } from 'main/util/TestUtil';
import FeatureConstants from '@strateos/features';
import { WorkflowActions } from '../../actions/WorkflowActions';
import RunCard from './index';

const singleRunObject = {
  project_id: 'p1e84znkc89tsr',
  protocol_id: null,
  success: null,
  reject_reason: null,
  success_notes: null,
  friendly_status: 'Completed',
  billing_valid: true,
  owner_id: 'u195953sd4vw8',
  completed_at: '2020-03-16T11:48:41.179-07:00',
  internal_run: true,
  created_at: '2020-03-16T10:12:59.264-07:00',
  accepted_at: '2020-03-16T10:12:59.262-07:00',
  progress: 100,
  test_mode: false,
  started_at: '2020-03-16T11:17:59.308-07:00',
  status: 'complete',
  title: 'WC7 Workout',
  pending_shipment_ids: [],
  id: 'r1e853kbm8ka27',
  reject_description: null,
  successors_deep: []
};

const singleRun = Immutable.fromJS(singleRunObject);

const workflowInstance = {
  id: '3302a892-6129-46ae-a8e4-b8dee9d41e85',
  createdBy: 'SYSTEM',
  createdOn: '2020-10-15T01:37:54+0000',
  lastModifiedBy: 'SYSTEM',
  lastModifiedOn: '2020-10-15T01:38:00+0000',
  label: 'Passage Cells Till Concentration',
  state: 'RUNNING',
  definitionId: '6512bd43-d9ca-a6e0-2c99-0b0a82652dca',
  definitionLabel: 'Passage Cells Till Concentration',
  organizationId: 'org13',
  submitRunsInTestMode: false
};

describe('RunCard', () => {
  const runStatus = 'accepted';
  const runView = 'queue';
  let wrapper, sandbox;

  before(() => {
    sandbox = sinon.createSandbox();
  });

  beforeEach(() => {
    sandbox.stub(client, 'getWorkflowGraphQLClient').returns(getMockGqlClient());
  });

  afterEach(() => {
    if (wrapper) wrapper.unmount();
    if (sandbox) sandbox.restore();
  });

  it('should render RunCard component', () => {
    wrapper = shallow(<RunCard run={singleRun} />);
    expect(wrapper).to.be.not.undefined;
  });

  it('should render Card with prop to with correct runspage url', () => {
    sandbox.stub(AcsControls, 'isFeatureEnabled').returns(true);
    Urls.use('transcriptic');
    wrapper = shallow(<RunCard run={singleRun} runStatus={runStatus} runView={runView} />);
    expect(wrapper.dive().find(Card).prop('to')).to.be.equal('/transcriptic/runspage/queue/accepted/runs/r1e853kbm8ka27/instructions');
  });

  it('should render workflow name on the card when workflow found', () => {
    sandbox.stub(WorkflowStore, 'getInstanceByRunId').returns(workflowInstance);
    const loadInstanceSpy = sandbox.spy(WorkflowActions, 'loadInstanceByRun');
    wrapper = shallow(<RunCard run={singleRun} runStatus={runStatus} runView={runView} />);
    expect(loadInstanceSpy.notCalled).to.be.true;
    const allParagraphs = wrapper.dive().find(Card).dive().find('p');
    expect(allParagraphs.at(allParagraphs.length - 1).find('span')
      .text()).to.equal('Workflow: ');
    expect(allParagraphs.at(allParagraphs.length - 1)
      .find('ConnectedProtocolTitle').prop('id')).to.equal(workflowInstance.label);
  });

  it('should render protocol name on the card when no workflow found', () => {
    wrapper = shallow(<RunCard run={singleRun} runStatus={runStatus} runView={runView} />);
    const allParagraphs = wrapper.dive().find(Card).dive().find('p');
    expect(allParagraphs.at(allParagraphs.length - 1).find('span')
      .text()).to.equal('Protocol: ');
  });

  it('should render Card with prop to with correct project page url', () => {
    sandbox.stub(AcsControls, 'isFeatureEnabled').returns(true);
    Urls.use('transcriptic');
    wrapper = shallow(<RunCard run={singleRun} />);
    expect(wrapper.dive().find(Card).prop('to')).to.be.equal('/transcriptic/p1e84znkc89tsr/runs/r1e853kbm8ka27');
  });

  it('should show feedback status if feedback is present', () => {
    wrapper = shallow(<RunCard run={Immutable.fromJS({ ...singleRunObject, success: false })} />);
    expect(wrapper.dive().find('.run-card__status').find('FeedbackStatus').length).to.be.equal(1);
  });

  it('should not show feedback status if feedback is not given yet', () => {
    wrapper = shallow(<RunCard run={singleRun} />);
    expect(wrapper.dive().find('.run-card__status').find('FeedbackStatus').length).to.be.equal(0);
  });

  it('should not show feedback status for in_progress run', () => {
    wrapper = shallow(<RunCard run={Immutable.fromJS({ ...singleRunObject, status: 'in_progress', success: true })} />);
    expect(wrapper.dive().find('.run-card__status').find('FeedbackStatus').length).to.be.equal(0);
  });

  it('should not show feedback status for accepted run', () => {
    wrapper = shallow(<RunCard run={Immutable.fromJS({ ...singleRunObject, status: 'accepted', success: true })} />);
    expect(wrapper.dive().find('.run-card__status').find('FeedbackStatus').length).to.be.equal(0);
  });

  it('should not load workflow instance when user does not have permission', () => {
    const loadInstanceSpy = sandbox.spy(WorkflowActions, 'loadInstanceByRun');
    sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.VIEW_EXPERIMENTS).returns(false);
    shallow(<RunCard run={Immutable.fromJS({ ...singleRunObject, status: 'accepted', success: true })} />).dive();

    expect(loadInstanceSpy.calledOnce).to.be.false;
  });

  it('should load workflow instance when user have permission', () => {
    const loadInstanceSpy = sandbox.spy(WorkflowActions, 'loadInstanceByRun');
    sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.VIEW_EXPERIMENTS).returns(true);
    shallow(<RunCard run={Immutable.fromJS({ ...singleRunObject, status: 'accepted', success: true })} />).dive();

    expect(loadInstanceSpy.calledOnce).to.be.true;
  });
});
