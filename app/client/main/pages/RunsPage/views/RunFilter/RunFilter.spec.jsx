import React from 'react';
import { expect } from 'chai';
import { mount } from 'enzyme';
import sinon from 'sinon';
import SessionStore from 'main/stores/SessionStore';
import { Button, MultiSelect } from '@transcriptic/amino';
import Immutable from 'immutable';
import _, { merge } from 'lodash';
import ModalActions from 'main/actions/ModalActions';
import RunFilter from 'main/pages/RunsPage/views/RunFilter/RunFilter';
import RunManagementStore from 'main/stores/mobx/RunManagementStore';
import RunFilterStore from 'main/stores/mobx/RunFilterStore';
import LabStore from 'main/stores/mobx/LabStore';
import FeatureStore from 'main/stores/FeatureStore';
import UserActions from 'main/actions/UserActions';
import AccessControlActions from 'main/actions/AccessControlActions';
import { threadBounce } from 'main/util/TestUtil';

describe('RunFilter Component', () => {
  const sandbox = sinon.createSandbox();
  const user = {
    id: 'u18dcbwhctbnj',
    name: 'john doe',
    email: 'jdoe@transcriptic.com',
    lastSignInIp: '0.0.0.0',
    createdAt: '2020-05-27T09:16:16.522-07:00'
  };

  let runFilter;
  let labStore;
  let runFilterStore;
  let runManagementStore;

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

    [{ name: 'Menlo Park', value: 'lb1' },
      { name: 'San Diego', value: 'lb2' },
      { name: 'All labs', value: 'all' }].forEach((lab) => labStore.labs.set(lab.value, lab));

    sandbox.stub(RunFilter, 'contextType').value(stubContext);
  };

  beforeEach(setup);

  afterEach(() => {
    if (runFilter) runFilter.unmount();
    sandbox.restore();
  });

  it('should have search field', () => {
    runFilter = mount(<RunFilter />);
    const SearchField = runFilter.find('SearchField');
    expect(SearchField.prop('placeholder')).to.equal('Search by run name, ID, barcode, etc');
  });

  it('should call onFilterOptionChanged with correct argument on reset search value', () => {
    runFilter = mount(<RunFilter />);
    const SearchField = runFilter.find('SearchField').at(0).find('TextInput');
    SearchField.simulate('change', { target: { value: 'search input for run' } });
    expect(runFilterStore.search).to.equal('search input for run');
    runFilter.find('SearchField').at(0).prop('reset')();
    expect(runFilterStore.search).to.equal('');
  });

  it('should have lab dropdown', () => {
    runFilter = mount(<RunFilter />);
    const labDropDown = runFilter.find('Select').at(0);
    expect(labDropDown.prop('placeholder')).to.equal('All labs');
    labDropDown.props().onChange({ target: { value: 'lb1' } });
    expect(runFilterStore.labId).to.equal('lb1');
  });

  it('should have 1 lab dropdown by default', () => {
    runFilter = mount(<RunFilter />);
    const dropDown = runFilter.find('Select').at(0);
    expect(dropDown).to.have.lengthOf(1);
    expect(dropDown.prop('placeholder')).to.equal('All labs');
  });

  it('should select `All operators, Unassigned` when current user is lab manager on a lab is selected', async () => {
    sandbox.stub(FeatureStore, 'canManageRunState').returns(true);
    sandbox.stub(UserActions, 'loadUsers').returns([user]);
    sandbox.stub(AccessControlActions, 'loadPermissions').returns([user]);
    runFilter = mount(<RunFilter showOperators />);

    await threadBounce(2);

    const labDropDown = runFilter.find('Select').at(0);
    labDropDown.simulate('change', { target: { value: 'lb1' } });

    const operatorDropDown = runFilter.find('OperatorsFilter').find(MultiSelect).at(0);
    const actualSelecterOperators = operatorDropDown.props().value;

    expect(runFilterStore.selectedOperatorIds.join(',')).to.equal('unassigned,all');
    expect(['unassigned', 'all']).to.deep.equal(actualSelecterOperators);
  });

  it('should select `Assigned to Me, Unassigned` when current user is lab operator on a lab is selected', async () => {
    sandbox.stub(FeatureStore, 'canManageRunState').returns(false);
    sandbox.stub(UserActions, 'loadUsers').returns([user]);
    sandbox.stub(AccessControlActions, 'loadPermissions').returns([user]);
    runFilter = mount(<RunFilter showOperators />);

    await threadBounce(2);

    const labDropDown = runFilter.find('Select').at(0);
    labDropDown.simulate('change', { target: { value: 'lb2' } });

    const operatorDropDown = runFilter.find('.run-filter').find(MultiSelect).at(0);
    const actualSelecterOperators = operatorDropDown.props().value;
    expect(runFilterStore.selectedOperatorIds.join(',')).to.equal(`unassigned,${user.id}`);
    expect([user.id, 'unassigned']).to.deep.equal(actualSelecterOperators);
  });

  it('should have operator dropdown', async () => {
    sandbox.stub(FeatureStore, 'canManageRunState').returns(true);
    sandbox.stub(AccessControlActions, 'loadPermissions').returns([]);
    sandbox.stub(UserActions, 'loadUsers').returns([{ id: 'op1', name: 'operator1' }]);
    runFilter = mount(<RunFilter showOperators />);

    await threadBounce(2);

    const operatorDropDown = runFilter.update().find('.run-filter').find(MultiSelect).at(0);
    expect(operatorDropDown.prop('placeholder')).to.equal('Select operators');
    expect(operatorDropDown.prop('options').length).to.equal(4);
  });

  it('should have LabConsumersFilter for org search', () => {
    runFilter = mount(<RunFilter showOrgFilter />);
    const labConsumersFilter = runFilter.find('LabConsumersFilter');
    expect(labConsumersFilter).to.have.lengthOf(1);
  });

  it('should have date range selector', () => {
    runFilterStore.updateRunStatus('all_runs');
    runFilter = mount(<RunFilter />);
    const dateFilter = runFilter.find('DatePicker');

    expect(dateFilter).to.have.lengthOf(1);
    expect(dateFilter.prop('placeholder')).to.equal('By submitted date');
    expect(dateFilter.prop('isRangeSelector')).to.be.true;
  });

  it('should open calender view modal on clicking calender icon', () => {
    const modalOpenStub = sandbox.stub(ModalActions, 'open').returns({});
    runFilter = mount(<RunFilter />);
    const calenderIcon = runFilter.find('.run-filter__calender-icon');
    calenderIcon.prop('onClick')();
    expect(modalOpenStub.calledOnce).to.be.true;
    expect(modalOpenStub.args[0][0]).to.equal('CALENDER_VIEW_MODAL');

  });

  it('should select `All operators, Unassigned` when current is lab manager on reset filters clicked', async () => {
    sandbox.stub(FeatureStore, 'canManageRunState').returns(true);
    sandbox.stub(AccessControlActions, 'loadPermissions').returns([]);
    sandbox.stub(UserActions, 'loadUsers').returns([{ id: 'op1', name: 'operator1' }]);
    runFilter = mount(<RunFilter showOperators />);

    await threadBounce(2);

    const resetFilters = runFilter.find(Button);
    resetFilters.simulate('click', {});

    const operatorDropDown = runFilter.find('.run-filter').find(MultiSelect).at(0);
    const actualSelecterOperators = operatorDropDown.props().value;
    expect(['unassigned', 'all']).to.deep.equal(actualSelecterOperators);
  });

  it('should select `Assigned to Me, Unassigned` when current is lab operator on reset filters clicked', async () => {
    sandbox.stub(FeatureStore, 'canManageRunState').returns(false);
    sandbox.stub(AccessControlActions, 'loadPermissions').returns([]);
    sandbox.stub(UserActions, 'loadUsers').returns([{ id: user.id, name: 'operator1' }]);
    runFilter = mount(<RunFilter showOperators />);

    await threadBounce(2);

    const resetFilters = runFilter.find(Button);
    resetFilters.simulate('click', {});
    const operatorDropDown = runFilter.find('.run-filter').find(MultiSelect).at(0);
    const actualSelecterOperators = operatorDropDown.props().value;
    expect([user.id, 'unassigned']).to.deep.equal(actualSelecterOperators);
  });

  it('should have reset button disabled on default state', () => {
    runFilter = mount(<RunFilter />);
    const resetButton = runFilter.find('button');
    expect(runFilterStore.resetDisabled).to.true;
    expect(resetButton.prop('disabled')).to.true;
    expect(resetButton.find('.reset-btn').hasClass('btn-disabled')).to.equal(true);
    expect(resetButton.children()).to.have.length(2);
  });

  it('should toggle `Reset` button on filter change', () => {
    sandbox.stub(FeatureStore, 'canManageRunState').returns(true);
    runFilter = mount(<RunFilter />);

    let resetButton = runFilter.find('button');
    expect(resetButton.prop('disabled')).to.true;

    const SearchField = runFilter.find('SearchField').at(0).find('TextInput');
    SearchField.simulate('change', { target: { value: 'r12xd' } });

    resetButton = runFilter.update().find('button');
    expect(resetButton.prop('disabled')).to.false;
    expect(runFilterStore.resetDisabled).to.false;

    resetButton.simulate('click', {});

    resetButton = runFilter.update().find('button');
    expect(runFilterStore.resetDisabled).to.true;
    expect(resetButton.prop('disabled')).to.true;
  });

  it('should toggle reset button on filter change', () => {
    sandbox.stub(FeatureStore, 'canManageRunState').returns(true);
    runFilter = mount(<RunFilter />);

    const SearchField = runFilter.find('SearchField').at(0).find('TextInput');
    SearchField.simulate('change', { target: { value: 'r12xd' } });
    expect(runFilterStore.resetDisabled).to.false;

    runFilter.find('SearchField').at(0).prop('reset')();
    expect(runFilterStore.resetDisabled).to.true;
  });

  it('should show corresponding placeholders for different runstatus', () => {
    const runStatus = {
      all_runs: 'submitted date',
      rejected: 'rejected date',
      aborted: 'aborted date',
      accepted: 'accepted date',
      pending: 'submitted date',
      in_progress: 'started date',
      complete: 'completed date',
      canceled: 'canceled date'
    };
    for (var key in runStatus) {
      runFilterStore.updateRunStatus(key);
      runFilter = mount(<RunFilter />);
      const dateFilter = runFilter.find('DatePicker');
      expect(dateFilter.prop('placeholder')).to.equal('By ' + runStatus[key]);
    }
  });

  it('should have runs dropdown', () => {
    runFilter = mount(<RunFilter showOrgFilter />);
    const runDropDown = runFilter.find('Select').at(1);
    expect(runDropDown.prop('placeholder')).to.equal('All runs');
  });

});
