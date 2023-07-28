import React from 'react';
import { mount, shallow } from 'enzyme';
import { expect } from 'chai';
import Immutable  from 'immutable';
import sinon from 'sinon';
import ReactionAPI from 'main/pages/ReactionPage/ReactionAPI';
import testRun from 'main/test/run-json/everyInstructionAdminRun.json';
import { BrowserRouter } from 'react-router-dom';
import { PageLayout } from 'main/components/PageLayout';
import SessionStore from 'main/stores/SessionStore';
import * as client from 'main/util/graphql/client';
import { getMockGqlClient } from 'main/util/TestUtil';
import RunPage from './RunPage';
import Header from './components/Header';

const immutableTestRun = Immutable.fromJS(testRun);
const matchPropTypes = { params: { subdomain: 'transcriptic', projectId: 'p1f8arbsrp92f3', runId: 'r123456' }, url: 'testurl' };
const rawOwner = testRun.owner;
const immutableOwner = Immutable.fromJS(rawOwner);

const rawProject = testRun.project;
const immutableProject = Immutable.fromJS(rawProject);

const reactionList = [
  {
    id: 'cc2c1ec1-8cf2-4ce8-a479-ea12406c3140',
    name: 'Miracle reaction',
    runId: 'r1aey3utseht7',
    reactants: [
      {
        id: 'ec2c1ec1-8cf2-4de8-a479-ea12406c1323',
        limiting: true,
        amount: '0.10 mmol',
        compound: {
          linkId: 'cmpl1dqc633snnzvh',
          smiles: 'CC1CCCC(N(C)C(=S)OC2CCC3CCCCC3C2)C1',
          name: 'tolnaftate'
        }
      }
    ]
  }
];

describe('Run Page', () => {
  const sandbox = sinon.createSandbox();
  let runPage;

  afterEach(() => {
    sandbox.restore();
    if (runPage) { runPage.unmount(); }
  });

  beforeEach(() => {
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.fromJS({ id: 'org123' }));
    sandbox.stub(client, 'getWorkflowGraphQLClient').returns(getMockGqlClient());
  });

  it('should render', () => {
    runPage = shallow(
      <RunPage
        project={immutableProject}
        run={immutableTestRun}
        owner={immutableOwner}
        match={matchPropTypes}
        isLoading={false}
      />
    );
    expect(runPage).to.be.ok;
  });

  it('should set run_id in intercom settings', () => {
    window.intercomSettings = {};
    runPage = shallow(
      <RunPage
        project={immutableProject}
        run={immutableTestRun}
        owner={immutableOwner}
        match={matchPropTypes}
        isLoading={false}
      />
    );
    expect(window.intercomSettings.run_id).to.be.equal(immutableTestRun.id);
  });

  it('should have Instructions as default tab', () => {
    runPage = shallow(
      <RunPage
        project={immutableProject}
        run={immutableTestRun}
        owner={immutableOwner}
        match={matchPropTypes}
        isLoading={false}
      />, { context: { router: {} } }
    );
    expect(runPage.dive().find('TabRouter').prop('defaultTabId')).to.equal('instructions');
  });

  it('should contain a reactionId if reaction exists', () => {
    const mockGetReaction = sandbox.stub(ReactionAPI, 'getReactions').returns({ then: (cb) => {
      cb(reactionList);
    }
    });
    runPage = mount(
      <BrowserRouter>
        <RunPage
          project={immutableProject}
          run={immutableTestRun}
          owner={immutableOwner}
          match={matchPropTypes}
          isLoading={false}
        />
      </BrowserRouter>
    );

    expect(mockGetReaction.calledOnce).to.be.true;
    expect(reactionList[0].id).to.equal(runPage.find(PageLayout).find(Header).prop('reactionId'));
  });

  it('should reactionId set to undefined if no reaction exists', () => {
    const mockGetReaction = sandbox.stub(ReactionAPI, 'getReactions').returns({ then: (cb) => {
      cb([]);
    }
    });
    runPage = mount(
      <BrowserRouter>
        <RunPage
          project={immutableProject}
          run={immutableTestRun}
          owner={immutableOwner}
          match={matchPropTypes}
          isLoading={false}
        />
      </BrowserRouter>
    );
    expect(mockGetReaction.calledOnce).to.be.true;
    expect(undefined).to.equal(runPage.find(PageLayout).find(Header).props().reactionId);
  });

  it('run settings modal should contain run, organizaion and lab ids as props', () => {
    const runValues = immutableTestRun.toJS();
    runValues.id = 'runId';
    runValues.lab_id = 'labId';
    runValues.organization_id = 'org13';
    runPage = mount(
      <BrowserRouter>
        <RunPage
          project={immutableProject}
          run={Immutable.fromJS(runValues)}
          owner={immutableOwner}
          match={matchPropTypes}
          isLoading={false}
        />
      </BrowserRouter>
    );
    expect(runPage.find(PageLayout).find('RunSettingsModal').prop('runId')).to.equal('runId');
    expect(runPage.find(PageLayout).find('RunSettingsModal').prop('labId')).to.equal('labId');
    expect(runPage.find(PageLayout).find('RunSettingsModal').prop('organizationId')).to.equal('org13');
  });
});
