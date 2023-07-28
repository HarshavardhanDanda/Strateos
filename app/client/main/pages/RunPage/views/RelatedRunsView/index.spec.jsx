import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';
import sinon from 'sinon';
import RunActions from 'main/actions/RunActions';
import FeatureConstants from '@strateos/features';
import AcsControls from 'main/util/AcsControls';
import Urls from 'main/util/urls';
import { getMockGqlClient } from 'main/util/TestUtil';
import * as client from 'main/util/graphql/client';
import RelatedRunsView from './index';
import { multipleRuns, singleRun } from './mocks';

describe('RelatedRunsView', () => {
  const matchPropTypes = { params: { subdomain: 'transcriptic', projectId: 'p1f8arbsrp92f3', runId: 'r123456' } };
  let wrapper, sandbox;

  const stubLoadRelatedRunsAction = data => {
    sandbox.stub(RunActions, 'loadRelatedRuns')
      .returns({
        done: cb => {
          return { data: cb(data), fail: () => ({}) };
        }
      });
  };
  const getConnectedRunCard = wrapper => {
    return wrapper.find('RunListSection').dive()
      .find('RunList').dive()
      .find('ConnectedRunCard');
  };
  const getRunItems = wrapper => {
    return wrapper.find('RunListSection').dive()
      .find('RunList').dive()
      .find('.related-runs-view__item');
  };

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

  it('should render page', () => {
    wrapper = shallow(
      <RelatedRunsView
        match={matchPropTypes}
      />
    );
    expect(wrapper).to.be.ok;
  });

  it('loads spinner while runs are being fetched', () => {
    const spy = sandbox.spy(RunActions, 'loadRelatedRuns');

    wrapper = shallow(
      <RelatedRunsView
        match={matchPropTypes}
      />
    );

    expect(spy.called).to.be.true;
    expect(wrapper.find('Spinner')).to.have.lengthOf(1);
  });

  it('Should render ZeroState when no related runs are present', () => {
    const matchPropTypes = { params: { subdomain: 'transcriptic', projectId: 'p1f9rbdmqxcm74', runId: 'r1f9rbf4eyaf6e' } };
    stubLoadRelatedRunsAction(singleRun);
    wrapper = shallow(
      <RelatedRunsView
        match={matchPropTypes}
      />
    );
    expect(wrapper.find('ZeroState')).to.have.lengthOf(1);
    expect(wrapper.find('RunListSection')).to.have.lengthOf(0);
  });

  it('run card is not clickable if it does not have proper permissions', () => {
    const matchPropTypes = { params: { subdomain: 'transcriptic', projectId: 'p1f9rbdmqxcm74', runId: 'r1fahe7vjffszc' } };
    sandbox.stub(AcsControls, 'isFeatureEnabled')
      .withArgs(FeatureConstants.VIEW_EDIT_RUN_DETAILS || FeatureConstants.VIEW_RUN_DETAILS).returns(false);

    stubLoadRelatedRunsAction(multipleRuns);
    wrapper = shallow(
      <RelatedRunsView
        match={matchPropTypes}
      />
    );
    const connectedRunCard = getConnectedRunCard(wrapper);
    const runCard = connectedRunCard.at(0).dive().find('RunCard');
    const card = runCard.dive().find('Card');
    expect(card.props().to).to.be.undefined;
  });

  it('run card is clickable if it has proper permissions', () => {
    const matchPropTypes = { params: { subdomain: 'transcriptic',
      projectId: 'p1f9rbdmqxcm74',
      runId: 'r1fahe7vjffszc' } };
    sandbox.stub(AcsControls, 'isFeatureEnabled')
      .withArgs(FeatureConstants.VIEW_EDIT_RUN_DETAILS || FeatureConstants.VIEW_RUN_DETAILS).returns(true);

    stubLoadRelatedRunsAction(multipleRuns);
    wrapper = shallow(
      <RelatedRunsView
        match={matchPropTypes}
      />
    );
    const connectedRunCard = getConnectedRunCard(wrapper);
    const runCard = connectedRunCard.at(0).dive().find('RunCard');
    const card = runCard.dive().find('Card');
    expect(card.props().to).to.not.be.undefined;
  });

  it('should return project page url', () => {
    const matchPropTypes = { params: { subdomain: 'transcriptic',
      projectId: 'p1efyfqbn4t29d',
      runId: 'r1fahe7vjffszc',
      runView: undefined,
      runStatus: undefined } };
    sandbox.stub(AcsControls, 'isFeatureEnabled')
      .withArgs(FeatureConstants.VIEW_EDIT_RUN_DETAILS).returns(true);
    Urls.org = '/transcriptic';

    stubLoadRelatedRunsAction(multipleRuns);
    wrapper = shallow(
      <RelatedRunsView
        match={matchPropTypes}
      />
    );
    const connectedRunCard = getConnectedRunCard(wrapper);
    const runCard = connectedRunCard.at(0).dive().find('RunCard');
    const card = runCard.dive().find('Card');
    expect(card.props().to).to.equal('/transcriptic/' +
      matchPropTypes.params.projectId + '/runs/' + matchPropTypes.params.runId);
  });

  it('should return run page url', () => {
    const matchPropTypes = { params: { subdomain: 'transcriptic',
      runId: 'r1fahe7vjffszc',
      runView: 'queue',
      runStatus: 'in_progress' } };
    sandbox.stub(AcsControls, 'isFeatureEnabled')
      .withArgs(FeatureConstants.VIEW_EDIT_RUN_DETAILS).returns(true);
    Urls.org = '/transcriptic';

    stubLoadRelatedRunsAction(multipleRuns);
    wrapper = shallow(
      <RelatedRunsView
        match={matchPropTypes}
      />
    );
    const connectedRunCard = getConnectedRunCard(wrapper);
    const runCard = connectedRunCard.at(0).dive().find('RunCard');
    const card = runCard.dive().find('Card');

    expect(card.props().to).to.equal('/transcriptic/runspage/' +
      matchPropTypes.params.runView + '/' + matchPropTypes.params.runStatus +
      '/runs/' + matchPropTypes.params.runId + '/instructions');
  });

  it('renders multiple runs correctly', () => {
    const matchPropTypes = { params: { subdomain: 'transcriptic', projectId: 'p1efyfqbn4t29d', runId: 'r1f7cj9vs6uz3z' } };
    stubLoadRelatedRunsAction(multipleRuns);
    wrapper = shallow(
      <RelatedRunsView
        match={matchPropTypes}
      />
    );
    const connectedRunCard = getConnectedRunCard(wrapper);
    const runCard = connectedRunCard.at(10).dive().find('RunCard');
    const isHighlightedSelectedRun = runCard.at(0).prop('isHighlighted');
    const selectedRun = runCard.at(0).prop('run');

    const nonSelectedRunCard = connectedRunCard.at(0).dive().find('RunCard');
    const isHighlightedNonSelectedRunCard = nonSelectedRunCard.at(0).prop('isHighlighted');
    const nonSelectedRun = nonSelectedRunCard.at(0).prop('run');

    expect(connectedRunCard).to.have.lengthOf(11);
    expect(isHighlightedSelectedRun).to.equal(true);
    expect(selectedRun.get('project_id')).to.equal('p1efyfqbn4t29d');
    expect(selectedRun.get('id')).to.equal('r1f7cj9vs6uz3z');

    expect(isHighlightedNonSelectedRunCard).to.equal(false);
    expect(nonSelectedRun.get('project_id')).to.equal('p1efyfqbn4t29d');
    expect(nonSelectedRun.get('id')).to.equal('r1fahe7vjffszc');
  });

  describe('run card connectors', () => {
    let runItems;

    beforeEach(() => {
      const matchPropTypes = { params: { subdomain: 'transcriptic', projectId: 'p1efyfqbn4t29d', runId: 'r1f7cj9vs6uz3z' } };
      stubLoadRelatedRunsAction(multipleRuns);
      wrapper = shallow(
        <RelatedRunsView
          match={matchPropTypes}
        />
      );
      runItems = getRunItems(wrapper);
    });

    it('should display connectors on all run cards except the first one', () => {
      expect(runItems.find('.related-runs-view__connector')).to.have.lengthOf(10);
    });

    it('should style run card containers correctly', () => {
      const containerStyle = {
        height: 146,
        marginBottom: 20,
        position: 'relative'
      };

      expect(runItems.at(0).find('.related-runs-view__item').prop('style')).to.deep.equal({
        ...containerStyle,
        marginLeft: 0
      });
      expect(runItems.at(6).find('.related-runs-view__item').prop('style')).to.deep.equal({
        ...containerStyle,
        marginLeft: 240
      });
      expect(runItems.at(7).find('.related-runs-view__item').prop('style')).to.deep.equal({
        ...containerStyle,
        marginLeft: 60
      });
      expect(runItems.at(8).find('.related-runs-view__item').prop('style')).to.deep.equal({
        ...containerStyle,
        marginLeft: 120
      });
    });

    it('should style run card connectors correctly', () => {
      const connectorStyles = {
        position: 'absolute',
        width: 30,
        left: -30,
        bottom: '50%',
        backgroundColor: 'transparent',
        borderWidth: '0 0 2px 2px',
        borderStyle: 'solid',
        borderRadius: '0 0 0 10px',
        zIndex: -1
      };

      expect(runItems.at(6).find('.related-runs-view__connector').prop('style')).to.deep.equal({
        ...connectorStyles,
        height: 508
      });
      expect(runItems.at(7).find('.related-runs-view__connector').prop('style')).to.deep.equal({
        ...connectorStyles,
        height: 1172
      });
      expect(runItems.at(8).find('.related-runs-view__connector').prop('style')).to.deep.equal({
        ...connectorStyles,
        height: 176
      });
      expect(runItems.at(10).find('.related-runs-view__connector').prop('style')).to.deep.equal({
        ...connectorStyles,
        height: 508
      });
    });
  });
});
