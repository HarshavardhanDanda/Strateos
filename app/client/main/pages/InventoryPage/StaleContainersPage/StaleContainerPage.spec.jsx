import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import { List, Table, Column, HierarchyPath, DateTime, SearchField } from '@transcriptic/amino';
import sinon from 'sinon';
import { StaleContainerPane as StaleContainersPage } from './StaleContainersPage';

const props = {
  results: [
    {
      adminFlaggedForExtensionAt: undefined,
      adminFlaggedForNotificationAt: undefined,
      containerId: 'ct1a7fc72x75b6',
      containerLabel: 'ABT737_1mM_042717',
      containerStatus: 'pending_destroy',
      containerTypeId: 'micro-1.5',
      createdAt: '2017-07-28T06:00:18.157-07:00',
      destructionRequest: true,
      id: '14021',
      markedPendingDestroyAt: undefined,
      staleNotificationAt: undefined,
      notifiedAt: '2018-04-04T15:54:19.481-07:00',
      willBeDestroyedAt: undefined,
      location: {
        id: 'loc19639dr5b7as'
      },
      container: {
        id: 'ct1a7fc72x75b6'
      },
      organization: {
        name: 'avatar-project-cpmcri'
      }
    }
  ]
};

describe('Stale Containers page table test', () => {
  let staleContainers;
  const sandbox = sinon.createSandbox();
  afterEach(() => {
    if (staleContainers) staleContainers.unmount();
    sandbox.restore();
  });

  it('Check if List is Present', () => {
    staleContainers = shallow(<StaleContainersPage {...props} />);
    expect(staleContainers.find(List).length).to.eql(1);
  });

  it('StaleContainers table should have 7 columns', () => {
    staleContainers = shallow(<StaleContainersPage {...props} />);
    const list = staleContainers.find(List);
    const table = list.dive().find(Table);

    expect(table.find(Column).length).to.equal(7);
  });

  it('Stale Containers table should have Extended At column', () => {
    staleContainers = shallow(<StaleContainersPage {...props} />);
    const list = staleContainers.find(List);
    const table = list.dive().find(Table);
    expect(table.find(Column).at(0).props().header).to.equal('Container');
    expect(table.find(Column).at(1).props().header).to.equal('container Type');
    expect(table.find(Column).at(2).props().header).to.equal('Location');
    expect(table.find(Column).at(3).props().header).to.equal('Organization');
    expect(table.find(Column).at(4).props().header).to.equal('Created');
    expect(table.find(Column).at(5).props().header).to.equal('Notified At');
    expect(table.find(Column).at(6).props().header).to.equal('Extended At');
  });

  it('Stale Containers should have columns sortable', () => {
    staleContainers = shallow(<StaleContainersPage {...props} />);
    const list = staleContainers.find(List);
    const table = list.dive().find(Table);
    expect(table.find(Column).length).to.equal(7);

    expect(table.find(Column).at(0).props().sortable).to.be.false;
    expect(table.find(Column).at(1).props().sortable).to.be.true;
    expect(table.find(Column).at(2).props().sortable).to.be.true;
    expect(table.find(Column).at(3).props().sortable).to.be.true;
    expect(table.find(Column).at(4).props().sortable).to.be.true;
    expect(table.find(Column).at(5).props().sortable).to.be.true;
    expect(table.find(Column).at(6).props().sortable).to.be.true;
  });

  it('Check values of First row', () => {
    staleContainers = shallow(<StaleContainersPage {...props} />);
    staleContainers.instance().setState({ hasLoaded: true });
    const list = staleContainers.find(List);
    const table = list.dive().find(Table);
    const firstRowColumns = table.dive().find('BodyCell');
    expect(firstRowColumns.at(1).dive().find('ContainerDetailsUrl').dive()
      .find('Url')
      .dive()
      .text()).to.eql('ct1a7fc72x75b6');
    expect(firstRowColumns.at(2).dive().find('ContainerTypeId').dive()
      .find('ContainerType')
      .dive()
      .text()).to.eql('micro-1.5');
    expect(firstRowColumns.at(3).dive()
      .find(HierarchyPath).length).to.eql(1);
    expect(firstRowColumns.at(4).dive()
      .text()).to.eql('avatar-project-cpmcri');
    expect(firstRowColumns.at(5).dive().find(DateTime).dive()
      .text()).to.eql('Jul 28, 2017');
    expect(firstRowColumns.at(6).dive().text()).to.eql('__');
    expect(firstRowColumns.at(7).dive().text()).to.eql('__');
  });

  it('Should set search state to blank and trigger onSearchChange when click on search close icon', () => {
    const onSearchChange = sandbox.spy(StaleContainersPage.prototype, 'onSearchChange');
    staleContainers = shallow(<StaleContainersPage {...props} />);
    staleContainers.setState({ search: '1234' });
    const searchFieldCloseIcon = staleContainers.find(SearchField).dive().find('span').at(2);
    searchFieldCloseIcon.simulate('click');
    expect(staleContainers.state().search).to.equal('');
    expect(onSearchChange.calledOnce).to.be.true;
  });
});
