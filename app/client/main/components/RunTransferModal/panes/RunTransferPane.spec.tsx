import React from 'react';
import sinon from 'sinon';
import Immutable  from 'immutable';
import _, { merge } from 'lodash';
import { Table } from '@transcriptic/amino';
import ProjectSelector from 'main/pages/ReactionPage/ProjectSelector.jsx';
import { mount, ReactWrapper } from 'enzyme';
import { expect } from 'chai';
import RunManagementStore from 'main/stores/mobx/RunManagementStore';
import RunFilterStore, { RunStatuses } from 'main/stores/mobx/RunFilterStore';
import LabStore from 'main/stores/mobx/LabStore';
import SessionStore from 'main/stores/SessionStore';
import RunActions from 'main/actions/RunActions';
import RunTransferPane from './RunTransferPane';

describe('RunTransferPane', () => {
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
    },
    {
      id: 'test_id_2',
      title: 'test_run_2',
      lab_id: 'lb1',
      status: 'accepted',
      total_cost: '0',
      protocol_id: 'test_protocol_2',
      protocol_name: 'test_protocol_2'
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
    runFilterStore.runStatus =  RunStatuses.AllRuns;
    sandbox.stub(RunTransferPane, 'contextType').value(stubContext);
  };

  beforeEach(setup);

  afterEach(() => {

    if (wrapper) {
      wrapper.unmount();
    }
    sandbox.restore();
  });

  it('should have a table component to show the runs that are being transferred', () => {
    wrapper = mount(<RunTransferPane />);
    expect(wrapper.find('.modal__body').find('h3').at(0).text()).to.equal('Runs being transferred');
    expect(wrapper.find(Table)).to.have.length(1);

  });

  it('should show the selected runs in the table', () => {
    runManagementStore.setSelectedRuns({ test_id_1: true });
    wrapper = mount(<RunTransferPane />);

    const list = wrapper.find(Table);
    expect(list.props().data.size).to.equal(1);
    expect(list.find('Row').at(1).find('BodyCell').at(0)
      .text()).to.equal('test_run_1');
    expect(list.find('Row').at(1).find('BodyCell').at(1)
      .text()).to.equal('test_protocol_1');
  });

  it('should show no records in the table if there are no selected runs', () => {
    runManagementStore.setSelectedRuns({ });
    wrapper = mount(<RunTransferPane />);

    const list = wrapper.find(Table);
    expect(list.props().data.size).to.equal(0);
    expect(list.find('Table').text()).to.equal('No records.');
  });

  it('should have ProjectSelector to select the project for transferring runs', () => {
    runManagementStore.setSelectedRuns({ });
    wrapper = mount(<RunTransferPane />);

    expect(wrapper.find(ProjectSelector)).to.have.length(1);
    expect(wrapper.find(ProjectSelector).prop('placeholder')).to.equal(
      'Select destination project'
    );
  });

  it('should have Cancel, Back and Transfer buttons', () => {
    runManagementStore.setSelectedRuns({ });
    wrapper = mount(<RunTransferPane />);

    const modalFooter = wrapper.find('.modal__footer');
    expect(modalFooter.find('button').at(0).text()).to.equal('Cancel');
    expect(modalFooter.find('button').at(1).text()).to.equal('Back');
    expect(modalFooter.find('button').at(2).text()).to.equal('Transfer');
  });

  it('should have Transfer button disabled if projectId is not selected', () => {
    wrapper = mount(<RunTransferPane />);
    wrapper.setState({ selectedProjectId: undefined });

    const modalFooter = wrapper.find('.modal__footer');
    expect(modalFooter.find('button').at(2).props().disabled).to.be.true;
  });

  it('should have Transfer button enabled if projectId is selected', () => {
    wrapper = mount(<RunTransferPane />);
    wrapper.setState({ selectedProjectId: 'some-project' });

    const modalFooter = wrapper.find('.modal__footer');
    expect(modalFooter.find('button').at(2).props().disabled).to.be.false;
  });

  it('should transfer runs to the project when Transfer button is clicked', () => {
    const transferRunsSpy = sandbox.spy(RunActions, 'multiTransfer');
    runManagementStore.setSelectedRuns({ test_id_1: true });
    wrapper = mount(<RunTransferPane />);
    wrapper.setState({ selectedProjectId: 'some-project' });

    const modalFooter = wrapper.find('.modal__footer');
    modalFooter.find('button').at(2).simulate('click');
    expect(transferRunsSpy.calledOnce).to.be.true;
    expect(transferRunsSpy.args[0][0].toString()).to.includes('test_id_1');
    expect(transferRunsSpy.args[0][1]).to.equal('some-project');
  });
});
