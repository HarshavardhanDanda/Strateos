import React from 'react';
import { expect, assert } from 'chai';
import { mount } from 'enzyme';
import { ButtonSelect, Button, Card, List } from '@transcriptic/amino';
import sinon from 'sinon';
import Immutable from 'immutable';
import { assign } from 'lodash';
import { RunsSearchStore } from 'main/stores/search';
import LabConsumerStore from 'main/stores/LabConsumerStore';
import FeatureStore from 'main/stores/FeatureStore';
import AcsControls from 'main/util/AcsControls';
import FeatureConstants from '@strateos/features';

import RunScheduleActions from 'main/actions/RunScheduleActions';
import AccessControlActions from 'main/actions/AccessControlActions';
import UserPreference from 'main/util/UserPreferenceUtil';
import SessionStore from 'main/stores/SessionStore';
import ApprovalsView from 'main/pages/RunsPage/views/ApprovalsView/ApprovalsView';
import CommonRunListView from 'main/pages/RunsPage/views/CommonRunListView';
import RunFilter from 'main/pages/RunsPage/views/RunFilter/RunFilter';
import RunManagementStore from 'main/stores/mobx/RunManagementStore';
import RunFilterStore from 'main/stores/mobx/RunFilterStore';
import LabStore from 'main/stores/mobx/LabStore';
import { thennable } from 'main/util/TestUtil';

const getPropsByStatus = (status = 'pending') => {
  return {
    id: 'r1ehezhnmykpf8',
    type: 'runs',
    links: {
      self: 'http://localhost:5555/api/runs/r1ehezhnmykpf8'
    },
    match: {
      params: {
        subdomain: 'strateos',
        runStatus: status
      },
      url: '/strateos/runspage/approvals/pending',
      path: '/strateos/runspage/approvals/pending'
    },
    actionsArray: [
      {
        title: 'Change Operator',
        type: 'info',
        label: 'Change Operator'
      },
      {
        title: 'Reschedule',
        type: 'info',
        label: 'Reschedule'
      },
      {
        title: 'Priority',
        type: 'info',
        label: 'Priority'
      }
    ]
  };
};

function getRuns() {
  return [
    {
      id: 'r1ehezhnmykpf8',
      title: 'Test1',
      status: 'pending',
      'billing_valid?': true,
      unrealized_input_containers_count: 0,
      pending_shipment_ids: [],
      total_cost: '29.63',
      created_at: '2021-04-28 13:27:41.786944',
      can_start_at: '2021-09-15T09:01:01.000-07:00'
    },
    {
      id: 'r1ehezhnmykpf6',
      title: 'Test2',
      status: 'pending',
      'billing_valid?': true,
      unrealized_input_containers_count: 0,
      pending_shipment_ids: [],
      total_cost: '29.63',
      created_at: '2021-04-28 13:27:41.786944'
    }
  ];
}

const labConsumers = [{
  id: 'lbc1fhskg9nf2n53',
  organization: {
    id: 'org13'
  }
}, {
  id: 'lbc1fhskg9nf2n54',
  organization: {
    id: 'org13'
  }
}];

function getRunByStatus(status) {
  return [{
    id: 'r1ehezhnmykpf8',
    status: status,
    'billing_valid?': true,
    unrealized_input_containers_count: 0,
    pending_shipment_ids: [],
    rejected_at: '2021-05-12T01:34:42.262-07:00',
    reject_reason: 'Platform under maintenance',
    total_cost: '29.63'
  }];
}

describe('Approvals View', () => {
  let component;
  const sandbox = sinon.createSandbox();
  const props = getPropsByStatus();

  const stubRunManagement = (runManagementOptions = {}) => {
    const labStore = new LabStore();
    labStore.labs.set('lab1', { name: 'San Diego', id: 'lab1' });
    labStore.labs.set('lab2', { name: 'Menlo Park', id: 'lab2' });
    labStore.labs.set('lab3', { name: 'Taco Bell', id: 'lab3' });
    labStore.labConsumers.set('labConsumer1', { id: 'lbc1fhskg9nf2n53',
      organization: {
        id: 'org13'
      } });
    labStore.labConsumers.set('labConsumer2', { id: 'lbc1fhskg9nf2n54',
      organization: {
        id: 'org13'
      } });
    const runFilterStore = new RunFilterStore(labStore);
    const runManagement = new RunManagementStore(runFilterStore, labStore);
    const stubContext = React.createContext({
      labStore,
      runFilterStore,
      runManagementStore: assign(runManagement, {
        loadRuns() {},
        runData: getRuns(),
        ...runManagementOptions
      })
    });

    sandbox.stub(ApprovalsView, 'contextType').value(stubContext);
    sandbox.stub(CommonRunListView, 'contextType').value(stubContext);
    sandbox.stub(RunFilter, 'contextType').value(stubContext);
  };

  beforeEach(() => {
    sandbox.stub(UserPreference, 'get');
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.Map({ id: 'org13' }));
    sandbox.stub(SessionStore, 'getUser').returns(Immutable.Map({ id: 'user3202' }));
    sandbox.stub(FeatureStore, 'getLabIdsWithFeatures').returns(['lab1', 'lab2', 'lab3']);
    sandbox.stub(UserPreference, 'save');
    sandbox.stub(LabConsumerStore, 'getAll').returns(Immutable.fromJS(labConsumers));
    sandbox.stub(RunScheduleActions, 'loadRunSchedules').returns({
      done: (cb) => {
        cb([]);
        return { fail: () => ({}) };
      }
    });
    sandbox.stub(AccessControlActions, 'loadPermissions').returns(thennable());
  });
  afterEach(() => {
    if (component) {
      component.unmount();
    }
    sandbox.restore();
  });

  it('should mount with correct props', () => {
    component = mount(<ApprovalsView {...props} />);
    expect(component.props().id).to.not.be.undefined;
    expect(component.props().type).to.equal('runs');
    expect(component.props().links).to.not.be.undefined;
    expect(component.props().match.params.runStatus).to.equal('pending');
    expect(component.props().actionsArray.length).to.not.equal(0);
  });

  it('should have expected props when active status is rejected', () => {
    stubRunManagement({ runData: getRunByStatus('rejected') });
    const props = getPropsByStatus('rejected');
    component = mount(<ApprovalsView {...props} />);
    const commonRunList = component.find('TabLayout').at(0).find(Card)
      .find('CommonRunListView');
    expect(commonRunList.props().statusForRuns).to.equal('rejected');
    expect(commonRunList.props().disabledSelection).to.be.true;
  });

  it('should have list component', () => {
    stubRunManagement();
    component = mount(<ApprovalsView {...props} />);
    const table = component.find('TabLayout').at(0).find(Card).find('CommonRunListView');
    expect(table.find(List).length).to.equal(1);
  });

  it('should have approvals actions options', () => {
    stubRunManagement();
    component = mount(<ApprovalsView {...props} />);
    expect(component.find(ButtonSelect)).to.have.length(1);
    expect(component.find(ButtonSelect).props().options.length).to.equal(2);
  });

  it('should display No Records if runData is empty', () => {
    stubRunManagement({ runData: [] });
    component = mount(<ApprovalsView {...props} />);
    const hash = component.find('TabLayout').at(0).find(Card)
      .find('CommonRunListView')
      .find(List)
      .find('Table');

    expect(hash.text()).to.equal('No records.');
  });

  it('Name and Id columns should have a ref attribute', () => {
    stubRunManagement();
    sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.VIEW_RUN_DETAILS).returns(true);

    component = mount(<ApprovalsView {...props} />);
    const tableBody = component.find('Table').find('td');
    const run_detail_url = `pending/runs/${props.id}`;
    const prime_directive_url = `${run_detail_url}/prime`;

    expect(tableBody.at(1).find('div').at(0).find('div')
      .at(0)
      .find('a')
      .props().href).to.equal(prime_directive_url);
    expect(tableBody.at(2).find('div').at(0).find('div')
      .at(0)
      .find('a')
      .props().href).to.equal(run_detail_url);
  });

  it('should display approval button if user has valid feature code', () => {
    stubRunManagement();
    sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.RUN_STATE_MGMT).returns(true);
    component = mount(<ApprovalsView {...props} />);
    expect(component.find('button').at(4).text()).to.equal('Approve');
  });

  it('should not display approval button if user has invalid feature code', () => {
    stubRunManagement();
    sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.RUN_STATE_MGMT).returns(false);
    component = mount(<ApprovalsView {...props} />);
    expect(component.find(Button).at(4)).not.to.equal('Approve');
  });

  it('approval button should be enabled if user clicks on single run', () => {
    stubRunManagement();
    sandbox.stub(RunsSearchStore, 'getSearch').returns(Immutable.fromJS({ results:  getRuns() }));
    sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.RUN_STATE_MGMT).returns(true);
    component = mount(<ApprovalsView {...props} />);
    component.find('.tx-checkbox').at(1).find('input').simulate('change', { target: { checked: true } })
      .update();
    expect(component.find(Button).at(4).props().disabled).to.be.false;
  });

  it('approval button should be disabled if user selects multiple runs', () => {
    stubRunManagement();
    sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.RUN_STATE_MGMT).returns(true);
    component = mount(<ApprovalsView {...props} />);
    // Click master checkbox to select all records, there are two records on this table
    component.find('.tx-checkbox')
      .at(0)
      .find('input')
      .simulate('change', { target: { checked: true } })
      .update();
    expect(component.find(Button).at(4).props().disabled).to.be.true;
  });

  it('rejected tab should have rejected date in the columns', () => {
    stubRunManagement({ runData: getRunByStatus('rejected') });
    const props = getPropsByStatus('rejected');
    component = mount(<ApprovalsView {...props} />);
    expect(component.find('BodyCell').at(2).find('p').text()).to.be.equal('Platform under maintenance');
    expect(component.find('BodyCell').at(4).find('p').text()).to.be.equal('May 12, 2021');
  });

  it('Approval modal cannot have scheduling if user has invalid feature flag', () => {
    stubRunManagement();
    const getACS = sandbox.stub(AcsControls, 'isFeatureEnabled');
    getACS.withArgs(FeatureConstants.RUN_STATE_MGMT).returns(true);
    getACS.withArgs(FeatureConstants.RESERVE_DEVICE_FOR_EXECUTION).returns(false);

    component = mount(<ApprovalsView {...props} />);
    component.find('input').at(2).simulate('change', { target: { checked: true } }).update();
    component.find(Button).at(4).simulate('click').update();

    expect(component.find('ApprovalModal').find('h3').at(3).length).to.equal(0);
  });

  it('should sort labs for filter', () => {
    stubRunManagement();
    component = mount(<ApprovalsView {...props}  />);

    const getOptionText = (comp, optionNumber) => {
      return comp.find('Select')
        .at(0)
        .prop('options')[optionNumber]
        .name;
    };
    expect(getOptionText(component, 0)).to.equal('All labs');
    expect(getOptionText(component, 1)).to.equal('Menlo Park');
    expect(getOptionText(component, 2)).to.equal('San Diego');
    expect(getOptionText(component, 3)).to.equal('Taco Bell');
  });

  it('should not show time in queue column for pending run', () => {
    stubRunManagement();
    component = mount(<ApprovalsView {...props} />);
    const commonRunList = component.find('TabLayout').at(0).find(Card)
      .find('CommonRunListView');
    const columnHeaders = commonRunList.find('List').find('Table').find('Header').find('HeaderCell');
    const headerNames = columnHeaders.map((header) => {
      return header.text();
    });
    assert.notInclude(headerNames, 'time in queue');
  });
});
