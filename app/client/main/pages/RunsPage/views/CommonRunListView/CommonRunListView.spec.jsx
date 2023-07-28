import React from 'react';
import { expect } from 'chai';
import Immutable from 'immutable';
import { Column, List } from '@transcriptic/amino';
import sinon from 'sinon';
import _ from 'lodash';

import ajax from 'main/util/ajax';
import { thennable } from 'main/util/TestUtil';
import CommonRunListView from 'main/pages/RunsPage/views/CommonRunListView';
import SessionStore from 'main/stores/SessionStore';
import KeyRegistry from 'main/util/UserPreferenceUtil/KeyRegistry';
import StoresContext, { makeNewContext } from 'main/stores/mobx/StoresContext';
import { RunStatuses } from 'main/stores/mobx/RunFilterStore';
import { Column as COLUMN } from 'main/pages/RunsPage/views/TableColumns';
import { PAGE_SIZE_OPTIONS } from 'main/util/List';

const props = () => ({
  id: 'sortable list',
  statusForRuns: RunStatuses.AllRuns,
  pageSizeOptions: PAGE_SIZE_OPTIONS,
  pageSize: 12,
  maxPage: 1,
  currentPage: 1,
  _capacity: 1,
  size: 1,
});

const DEFAULT_COLUMNS = [COLUMN.Name, COLUMN.Protocol, COLUMN.Id, COLUMN.Status, COLUMN.Org, COLUMN.Operator];

const orgRenderer = record => <b>{record.get('organization')}</b>;

function CommonRunListViewWithContext({ stores, ...props }) {
  return (
    <StoresContext.Provider value={stores}>
      <CommonRunListView {...props}>
        <Column renderCellContent={orgRenderer} header="name" id="title" sortable />
      </CommonRunListView>
    </StoresContext.Provider>
  );
}

describe('Common Run List View', () => {
  let wrapper;
  let component;
  let storesContext;
  const sandbox = sinon.createSandbox();

  const mount = (customProps) => {
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.Map({ id: 'org13' }));
    sandbox.stub(SessionStore, 'getUser').returns(Immutable.Map({ id: 'user3202' }));
    sandbox.stub(ajax, 'post').returns(thennable({ results: [], num_pages: 0, per_page: 0 }));
    storesContext = makeNewContext();
    wrapper = enzyme.mount(<CommonRunListViewWithContext stores={storesContext} {...(customProps || props())} />);
    component = wrapper.find(CommonRunListView);
  };

  afterEach(() => {
    component = undefined;
    if (wrapper) {
      wrapper.unmount();
    }
    sandbox.restore();
  });

  it('should render without error', () => {
    return mount();
  });

  it('should have list component', () => {
    mount();
    expect(component.find(List).length).to.equal(1);
  });

  it('should be paginated', () => {
    mount();
    expect(component.find('.list__pagination').length).to.equal(1);
  });

  it('should show table', () => {
    mount();
    expect(component.find('Table').length).to.equal(1);
  });

  it('should have list component with expected props when run status is all_runs', () => {
    mount();
    const list = component.find(List);
    expect(list.props().id).to.be.equal(KeyRegistry.COMMON_RUNS_TABLE + '_' + RunStatuses.AllRuns);
    expect(list.props().persistKeyInfo).to.be.deep.equal({
      appName: 'Web',
      orgId: 'org13',
      userId: 'user3202',
      key: KeyRegistry.COMMON_RUNS_TABLE + '_' + RunStatuses.AllRuns
    });
    expect(list.props().visibleColumns).to.be.deep.equal([...DEFAULT_COLUMNS, COLUMN.Submitted]);
  });

  it('should have list component with expected props when run status is aborted', () => {
    const customProps = { ...props, statusForRuns: RunStatuses.Aborted };
    mount(customProps);
    const list = component.find(List);
    expect(list.props().id).to.be.equal(KeyRegistry.COMMON_RUNS_TABLE + '_' + RunStatuses.Aborted);
    expect(list.props().persistKeyInfo).to.be.deep.equal({
      appName: 'Web',
      orgId: 'org13',
      userId: 'user3202',
      key: KeyRegistry.COMMON_RUNS_TABLE + '_' + RunStatuses.Aborted
    });
    expect(list.props().visibleColumns).to.be.deep.equal([...DEFAULT_COLUMNS, COLUMN.Aborted]);
  });

  it('should have list component with expected props when run status is accepted', () => {
    const customProps = { ...props, statusForRuns: RunStatuses.Accepted };
    mount(customProps);
    const list = component.find(List);
    expect(list.props().id).to.be.equal(KeyRegistry.COMMON_RUNS_TABLE + '_' + RunStatuses.Accepted);
    expect(list.props().persistKeyInfo).to.be.deep.equal({
      appName: 'Web',
      orgId: 'org13',
      userId: 'user3202',
      key: KeyRegistry.COMMON_RUNS_TABLE + '_' + RunStatuses.Accepted
    });
    expect(list.props().visibleColumns).to.be.deep.equal([...DEFAULT_COLUMNS, COLUMN.ScheduledStart, COLUMN.AcceptedAt]);
  });

  it('should have list component with expected props when run status is canceled', () => {
    const customProps = { ...props, statusForRuns: RunStatuses.Canceled };
    mount(customProps);
    const list = component.find(List);
    expect(list.props().id).to.be.equal(KeyRegistry.COMMON_RUNS_TABLE + '_' + RunStatuses.Canceled);
    expect(list.props().persistKeyInfo).to.be.deep.equal({
      appName: 'Web',
      orgId: 'org13',
      userId: 'user3202',
      key: KeyRegistry.COMMON_RUNS_TABLE + '_' + RunStatuses.Canceled
    });
    expect(list.props().visibleColumns).to.be.deep.equal([COLUMN.Name, COLUMN.Protocol, COLUMN.Id, COLUMN.Status, COLUMN.Org, COLUMN.Canceled, COLUMN.CanceledReason]);
  });

  it('should have list component with expected props when run status is complete', () => {
    const customProps = { ...props, statusForRuns: RunStatuses.Complete };
    mount(customProps);
    const list = component.find(List);
    expect(list.props().id).to.be.equal(KeyRegistry.COMMON_RUNS_TABLE + '_' + RunStatuses.Complete);
    expect(list.props().persistKeyInfo).to.be.deep.equal({
      appName: 'Web',
      orgId: 'org13',
      userId: 'user3202',
      key: KeyRegistry.COMMON_RUNS_TABLE + '_' + RunStatuses.Complete
    });
    expect(list.props().visibleColumns).to.be.deep.equal([...DEFAULT_COLUMNS, COLUMN.Completed]);
  });

  it('should have list component with expected props when run status is in_progress', () => {
    const customProps = { ...props, statusForRuns: RunStatuses.InProgress };
    mount(customProps);
    const list = component.find(List);
    expect(list.props().id).to.be.equal(KeyRegistry.COMMON_RUNS_TABLE + '_' + RunStatuses.InProgress);
    expect(list.props().persistKeyInfo).to.be.deep.equal({
      appName: 'Web',
      orgId: 'org13',
      userId: 'user3202',
      key: KeyRegistry.COMMON_RUNS_TABLE + '_' + RunStatuses.InProgress
    });
    expect(list.props().visibleColumns).to.be.deep.equal([...DEFAULT_COLUMNS, COLUMN.Started]);
  });

  it('should have list component with expected props when run status is pending', () => {
    const customProps = { ...props, statusForRuns: RunStatuses.Pending };
    mount(customProps);
    const list = component.find(List);
    expect(list.props().id).to.be.equal(KeyRegistry.COMMON_RUNS_TABLE + '_' + RunStatuses.Pending);
    expect(list.props().persistKeyInfo).to.be.deep.equal({
      appName: 'Web',
      orgId: 'org13',
      userId: 'user3202',
      key: KeyRegistry.COMMON_RUNS_TABLE + '_' + RunStatuses.Pending
    });
    expect(list.props().visibleColumns).to.be.deep.equal([
      COLUMN.Name, COLUMN.Id, COLUMN.Status, COLUMN.Org, COLUMN.Submitted, COLUMN.RequestedDate]);
  });

  it('should have list component with expected props when run status is rejected', () => {
    const customProps = { ...props, statusForRuns: RunStatuses.Rejected };
    mount(customProps);
    const list = component.find(List);
    expect(list.props().id).to.be.equal(KeyRegistry.COMMON_RUNS_TABLE + '_' + RunStatuses.Rejected);
    expect(list.props().persistKeyInfo).to.be.deep.equal({
      appName: 'Web',
      orgId: 'org13',
      userId: 'user3202',
      key: KeyRegistry.COMMON_RUNS_TABLE + '_' + RunStatuses.Rejected
    });
    expect(list.props().visibleColumns).to.be.deep.equal([COLUMN.Name, COLUMN.Id, COLUMN.Org, COLUMN.Rejected, COLUMN.Submitted, COLUMN.Reason]);
  });

});
