import React from 'react';
import sinon from 'sinon';
import Immutable  from 'immutable';
import _, { merge } from 'lodash';
import { List } from '@transcriptic/amino';
import { mount, ReactWrapper } from 'enzyme';
import { expect } from 'chai';
import RunManagementStore from 'main/stores/mobx/RunManagementStore';
import RunFilterStore, { RunStatuses } from 'main/stores/mobx/RunFilterStore';
import LabStore from 'main/stores/mobx/LabStore';
import SessionStore from 'main/stores/SessionStore';
import CommonRunListView from 'main/pages/RunsPage/views/CommonRunListView';

import RunSelectionPane from './RunSelectionPane';
import RunSelectionFilter from './RunSelectionFilter';

describe('RunSelectionPane', () => {
  const sandbox = sinon.createSandbox();
  const user = {
    id: 'u18dcbwhctbnj',
    name: 'john doe',
    email: 'jdoe@transcriptic.com',
    lastSignInIp: '0.0.0.0',
    createdAt: '2020-05-27T09:16:16.522-07:00'
  };

  const runs = [
    {
      id: 'test_id_1',
      title: 'test_run_1',
      lab_id: 'lb1',
      status: 'accepted',
      total_cost: '0',
      protocol_id: 'test_protocol_1',
      protocol_name: 'test_protocol_1'
    }
  ];

  let wrapper: ReactWrapper;
  let labStore: LabStore;
  let runFilterStore: RunFilterStore;
  let runManagementStore: RunManagementStore;

  const setup = () => {
    sandbox.stub(SessionStore, 'getUser').returns(Immutable.fromJS(user));
    labStore = new LabStore();
    runFilterStore = new RunFilterStore(labStore);
    runManagementStore = new RunManagementStore(runFilterStore, labStore);

    const stubContext = React.createContext({
      labStore,
      runFilterStore: merge(runFilterStore, {
        userId: user.id
      }),
      runManagementStore
    });

    runManagementStore.runData = runs;
    runFilterStore.runStatus =  RunStatuses.AllWithRejectedAndCancelled;
    sandbox.stub(RunSelectionPane, 'contextType').value(stubContext);
  };

  beforeEach(setup);

  afterEach(() => {

    if (wrapper) {
      wrapper.unmount();
    }
    sandbox.restore();
  });

  it('should have RunSelectionFilter for the filters', () => {
    wrapper = mount(<RunSelectionPane userId={user.id} />);
    expect(wrapper.find(RunSelectionFilter)).to.have.length(1);
    expect(wrapper.find(RunSelectionFilter).props().userId).to.equal(user.id);
  });

  it('should have CommonRunsListView to show the list of runs', () => {
    wrapper = mount(<RunSelectionPane userId={user.id} />);
    expect(wrapper.find(CommonRunListView)).to.have.length(1);
    expect(wrapper.find(CommonRunListView).find(List)).to.have.length(1);
  });

  it('should pass selected runs to the CommonRunsListView', () => {
    const selectedRuns = { test_id_1: true };
    runManagementStore.setSelectedRuns(selectedRuns);
    wrapper = mount(<RunSelectionPane userId={user.id} />);
    expect(wrapper.find(CommonRunListView).prop('selectedRuns')).to.eql(
      selectedRuns
    );
  });

  it('should have pagination', () => {
    wrapper = mount(<RunSelectionPane userId={user.id} />);
    expect(wrapper.find('.list__pagination').length).to.equal(1);
  });

  it('should have Cancel, Continue buttons', () => {
    wrapper = mount(<RunSelectionPane userId={user.id} />);
    expect(wrapper.find('button').at(0).text()).to.equal('Cancel');
    expect(wrapper.find('button').at(1).text()).to.equal('Continue');
  });

  it('should have Continue button enabled if runs are selected', () => {
    const selectedRuns = { test_id_1: true };
    runManagementStore.setSelectedRuns(selectedRuns);
    wrapper = mount(<RunSelectionPane userId={user.id} />);
    expect(wrapper.find('button').at(1).props().disabled).to.be.false;
  });

  it('should have Continue button disabled if runs are selected', () => {
    const selectedRuns = { };
    runManagementStore.setSelectedRuns(selectedRuns);
    wrapper = mount(<RunSelectionPane userId={user.id} />);
    expect(wrapper.find('button').at(1).props().disabled).to.be.true;
  });
});
