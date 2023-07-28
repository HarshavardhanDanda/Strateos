import React from 'react';
import { expect } from 'chai';
import { ButtonSelect, Button } from '@transcriptic/amino';
import sinon from 'sinon';
import _, { merge } from 'lodash';
import Immutable  from 'immutable';

import ajax from 'main/util/ajax';
import AcsControls from 'main/util/AcsControls';
import FeatureConstants from '@strateos/features';
import { RunsPageActions } from 'main/pages/RunsPage/views/RunFilter/RunsActions';
import SessionStore from 'main/stores/SessionStore';
import FeatureStore from 'main/stores/FeatureStore';
import OrganizationStore from 'main/stores/OrganizationStore';
import LabConsumerStore from 'main/stores/LabConsumerStore';
import CommonRunListView from 'main/pages/RunsPage/views/CommonRunListView';
import RunFilter from 'main/pages/RunsPage/views/RunFilter/RunFilter';
import StoresContext, { makeNewContext } from 'main/stores/mobx/StoresContext';
import RunManagementStore from 'main/stores/mobx/RunManagementStore';
import RunFilterStore from 'main/stores/mobx/RunFilterStore';
import LabStore from 'main/stores/mobx/LabStore';
import UserActions from 'main/actions/UserActions';
import AccessControlActions from 'main/actions/AccessControlActions';
import { thennable } from 'main/util/TestUtil';
import { getDefaultSearchPerPage } from 'main/util/List';
import QueueView from './QueueView';

const filterOptions = {
  query: '',
  lab_id: 'lb1',
  organization_id: 'all',
  org_name: '',
  status: 'aborted,accepted,complete,in_progress',
  page: 1,
  per_page: getDefaultSearchPerPage(),
  currentPage: 1,
  num_pages: 1,
  sort_by: 'id',
  direction: 'desc'
};

const props = {
  id: 'r1ehezhnmykpf8',
  type: 'runs',
  links: {
    self: 'http://localhost:5555/api/runs/r1ehezhnmykpf8'
  },
  match: {
    params: {
      subdomain: 'strateos',
      runStatus: 'all_runs'
    },
    url: '/strateos/runspage/queue/all_runs',
    path: '/strateos/runspage/queue/all_runs'
  },
  orgId: 'org13',
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
  ],
  renderOrganization: () => {},
  userId: 'user123'
};

const labConsumers = [{
  id: 'lbc1fhskg9nf2n53',
  organization: {
    id: 'org13'
  }
}, {
  id: 'lbc1fhskg9nf2n53',
  organization: {
    id: 'org13'
  }
}];

const stubRunManagement = (runManagementOptions = {}) => {
  const sandbox = sinon.createSandbox();
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
    runManagementStore: merge(runManagement, {
      loadRuns() {},
      runData: getRuns(),
      ...runManagementOptions
    })
  });
  sandbox.stub(QueueView, 'contextType').value(stubContext);
  sandbox.stub(CommonRunListView, 'contextType').value(stubContext);
  sandbox.stub(RunFilter, 'contextType').value(stubContext);
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
      created_at: '2021-04-28 13:27:41.786944'
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

describe('Queue View', () => {
  let wrapper;
  let wrapperContext;
  let storesContext;
  const sandbox = sinon.createSandbox();

  function QueueViewWithContext({ stores, ...props }) {
    return (
      <StoresContext.Provider value={stores}>
        <QueueView {...props} />
      </StoresContext.Provider>
    );
  }

  const mount = (customContext, customProps) => {
    if (customContext) {
      storesContext = customContext;
    } else {
      sandbox.stub(ajax, 'post').returns(thennable({ results: [], num_pages: 0, per_page: 0 }));
      storesContext = makeNewContext();
    }

    wrapperContext = enzyme.mount(<QueueViewWithContext stores={storesContext} {...(customProps || props)} />);
    wrapper = wrapperContext.find(QueueView);
  };

  beforeEach(() => {
    sandbox.stub(FeatureStore, 'getLabIdsWithFeatures').returns(['lab1', 'lab2', 'lab3']);
    sandbox.stub(SessionStore, 'getUser').returns(Immutable.fromJS({ id: 'u18dcbwhctbnj' }));
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.fromJS({ id: 'org13' }));
    sandbox.stub(LabConsumerStore, 'getAll').returns(Immutable.fromJS(labConsumers));
    sandbox.stub(RunsPageActions, 'options').returns(Immutable.Map(filterOptions));
    sandbox.stub(FeatureStore, 'canManageRunState').returns(false);
    sandbox.stub(OrganizationStore, 'findBySubdomain').returns(Immutable.fromJS({ id: 'org13' }));
    sandbox.stub(OrganizationStore, 'isStrateosAccount').returns(false);
    sandbox.stub(AccessControlActions, 'loadPermissions').returns(thennable([{ userId: 'user123' }]));
    sandbox.stub(UserActions, 'loadUsers').returns(thennable([{ name: 'user123', id: 'user123' }]));
    stubRunManagement();
  });

  afterEach(() => {
    wrapper = undefined;
    if (wrapperContext) {
      wrapperContext.unmount();
    }
    sandbox.restore();
  });

  it('should mount with correct props', () => {
    mount();
    expect(wrapper.props().id).to.not.be.undefined;
    expect(wrapper.props().type).to.equal('runs');
    expect(wrapper.props().links).to.not.be.undefined;
    expect(wrapper.props().match.params.runStatus).to.equal('all_runs');
    expect(wrapper.props().orgId).to.not.be.undefined;
    expect(wrapper.props().actionsArray.length).to.not.equal(0);
    expect(wrapper.props().renderOrganization).to.not.be.undefined;
  });

  it('should have expected props when active status is accepted', () => {
    const acceptedProps = {
      ...props,
      match: {
        params: {
          subdomain: 'strateos',
          runStatus: 'accepted'
        },
        url: '/strateos/runspage/queue/accepted',
        path: '/strateos/runspage/queue/accepted'
      }
    };
    mount(undefined, acceptedProps);
    expect(wrapper.props().type).to.equal('runs');
    expect(wrapper.props().match.params.runStatus).to.equal('accepted');
    const commonRunList = wrapper.find('TabLayout').at(0).find('Card')
      .find('CommonRunListView');
    expect(commonRunList.props().statusForRuns).to.equal('accepted');
  });

  it('should have queue actions options for the Queue view', () => {
    mount();
    expect(wrapper.find(ButtonSelect)).to.have.length(1);
    expect(wrapper.find(ButtonSelect).props().options.map(o => o.id)).to.have.ordered.members(['accepted', 'in_progress', 'complete', 'aborted', 'canceled', 'all_runs']);
  });

  it('should display assign_to_me button if user has valid feature code', () => {
    sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.CLAIM_RUN).returns(true);
    mount();
    expect(wrapper.find(Button).at(7).find('span').at(1)
      .text()).to.equal('Assign to me');
  });

  it('should not display assign_to_me button if user has invalid feature code', () => {
    sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.CLAIM_RUN).returns(false);
    mount();
    expect(wrapper.find('Button').at(7).length).to.equal(0);
  });

  it('should display priority button if user has valid feature code', () => {
    sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.RUN_STATE_MGMT).returns(true);
    mount();
    expect(wrapper.find('button').at(8).text()).to.equal('Priority');
  });

  it('should not display priority button if user do not have valid feature code', () => {
    sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.RUN_STATE_MGMT).returns(false);
    mount();
    expect(wrapper.find('button').at(8).length).to.equal(0);
  });

  it('should display assign button if user has valid feature code', () => {
    sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.RUN_STATE_MGMT).returns(true);
    mount();
    expect(wrapper.find('button').at(7).text()).to.equal('Assign');
  });

  it('should not display assign button if user do not have invalid feature code', () => {
    sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.RUN_STATE_MGMT).returns(false);
    mount();
    expect(wrapper.find('button').at(7).length).to.equal(0);
  });

  it('should have expected props when active status is canceled', () => {
    const canceledProps = {
      ...props,
      match: {
        params: {
          subdomain: 'strateos',
          runStatus: 'canceled'
        },
        url: '/strateos/runspage/queue/canceled',
        path: '/strateos/runspage/queue/canceled'
      }
    };
    mount(undefined, canceledProps);
    expect(wrapper.props().type).to.equal('runs');
    expect(wrapper.props().match.params.runStatus).to.equal('canceled');
    const commonRunList = wrapper.find('TabLayout').at(0).find('Card')
      .find('CommonRunListView');
    expect(commonRunList.props().statusForRuns).to.equal('canceled');
  });
});
