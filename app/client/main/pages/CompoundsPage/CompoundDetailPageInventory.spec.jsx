import React from 'react';
import sinon from 'sinon';
import Immutable from 'immutable';
import { expect } from 'chai';
import { shallow, mount } from 'enzyme';
import {
  List,
  Column,
  Table,
  TableLayout
} from '@transcriptic/amino';
import ContainerStore     from 'main/stores/ContainerStore';
import UserStore          from 'main/stores/UserStore';
import AliquotStore from 'main/stores/AliquotStore';
import ContainerTypeStore from 'main/stores/ContainerTypeStore';
import AliquotCompoundLinkStore from 'main/stores/AliquotCompoundLinkStore';
import AcsControls from 'main/util/AcsControls';
import ContainerActions   from 'main/actions/ContainerActions';
import AliquotAPI from 'main/api/AliquotAPI';
import BaseTableTypes from 'main/components/BaseTableTypes';
import CompoundDetailPageInventory from './CompoundDetailPageInventory';
import containerData from './mocks/container.json';
import CompoundInventoryFilters from './CompoundInventoryFilters';

const user = Immutable.Map({
  id: 'u1',
  email: 'tr-usadmgr@strateos.com',
  created_at: '2020-10-06T23:15:03.047-07:00',
  name: 'Admin LabMgr',
  'two_factor_auth_enabled?': false,
  'locked_out?': null,
  profile_img_url: null
});

const inventoryFilters =  {
  query: '*',
  searchFields: ['barcode'],
  searchContainerType: []
};

const aliquot = Immutable.fromJS([
  {
    mass_mg: 20,
    compound_link_ids: ['12345'],
    created_at: '2017-10-06T15:54:21.438-07:00',
    name: 'KAPA Pure Beads 2',
    well_idx: 0,
    container_id: 'ct1artkx88nkzd',
    type: 'aliquots',
    id: 'aq1artkx88szdh',
    volume_ul: '725.0'
  }
]);

const aliquot1 = Immutable.fromJS([
  {
    mass_mg: 20,
    compound_link_ids: ['123456'],
    created_at: '2017-10-06T15:54:21.438-07:00',
    name: 'KAPA Pure Beads 2',
    well_idx: 0,
    container_id: 'ct1artkx88nkzd',
    type: 'aliquots',
    id: 'aq1artkx88sz',
    volume_ul: 0
  }
]);

const aliquot2 = Immutable.fromJS([
  {
    mass_mg: null,
    compound_link_ids: ['1234567'],
    created_at: '2017-10-06T15:54:21.438-07:00',
    name: 'KAPA Pure Beads 2',
    well_idx: 0,
    container_id: 'ct1artkx88nkzd',
    type: 'aliquots',
    id: 'aq1artkx88',
    volume_ul: '100.0'
  }
]);

const containerType = Immutable.fromJS({
  name: '500mL Bottle',
  well_volume_ul: '500000.0',
  well_depth_mm: '0.0',
  catalog_number: 'not_applicable',
  col_count: 1
});

const aliquotCompoundLinks = Immutable.fromJS([
  {
    id: '1725',
    type: 'aliquot_compound_links',
    aliquot_id: 'aq1artkx88szdh',
    compound_link_id: '12345',
    m_moles: '0.013775',
    concentration: 19,
    solubility_flag: true
  }
]);

const aliquotCompoundLinks1 = Immutable.fromJS([
  {
    id: '1725',
    type: 'aliquot_compound_links',
    aliquot_id: 'aq1artkx88sz',
    compound_link_id: '123456',
    m_moles: '0.013775',
    concentration: null,
    solubility_flag: true
  }
]);

const aliquotCompoundLinks2 = Immutable.fromJS([
  {
    id: '1725',
    type: 'aliquot_compound_links',
    aliquot_id: 'aq1artkx88',
    compound_link_id: '1234567',
    m_moles: '0.013775',
    concentration: null,
    solubility_flag: true
  }
]);

function getTestComponent(id, isMount = false, context = { context: { router: {} } }) {
  if (isMount) {
    return mount(<CompoundDetailPageInventory id={id} />, context);
  } else {
    return shallow(<CompoundDetailPageInventory id={id} />, context);
  }
}

describe('CompoundDetailPageInventory', () => {
  let wrapper;
  const sandbox = sinon.createSandbox();

  afterEach(() => {
    sandbox.restore();
  });

  it('should render the list component when we have data', () => {
    sandbox.stub(UserStore, 'getById').returns(user);
    sandbox.stub(ContainerStore, 'getByIds').returns(containerData.data);
    wrapper = getTestComponent('12345')
      .setState({ loading: false });
    const list = wrapper.find('List');
    const paginate = list.dive().find('Pagination');
    const columns = list.dive().find('Column');
    const displayRows = list.dive().find('Table').dive().find('Body')
      .find('Row');

    expect(list.length).to.equal(1);
    expect(paginate.length).to.equal(1);
    expect(displayRows.length).to.equal(2);
    expect(columns.length).to.equal(11);
    expect(columns.at(0).props().header).to.equal('type');
    expect(columns.at(1).props().header).to.equal('format');
    expect(columns.at(2).props().header).to.equal('name');
    expect(columns.at(3).props().header).to.equal('id');
    expect(columns.at(4).props().header).to.equal('barcode');
    expect(columns.at(5).props().header).to.equal('contents');
    expect(columns.at(6).props().header).to.equal('condition');
    expect(columns.at(7).props().header).to.equal('created');
    expect(columns.at(8).props().header).to.equal('last used');
    expect(columns.at(9).props().header).to.equal('organization');
    expect(columns.at(10).props().header).to.equal('created by');
  });

  it('should render the zero state component when we dont have data', () => {
    wrapper = getTestComponent('12345')
      .setState({ loading: false });
    const zeroState = wrapper.find('ZeroState');

    expect(zeroState.length).to.equal(1);
    expect(zeroState.dive().find('Button').length).to.equal(0);
    expect(zeroState.prop('title')).to.equal('This compound isn\'t linked to any inventory yet!');
  });

  it('should render the zero state component with link button when i have permission', () => {
    sandbox.stub(AcsControls, 'isFeatureEnabled').returns(true);
    wrapper = getTestComponent('12345')
      .setState({ loading: false });
    const zeroState = wrapper.find('ZeroState');
    const button = zeroState.dive().find('Button');

    expect(zeroState.length).to.equal(1);
    expect(button.length).to.equal(1);
    expect(button.dive().text()).to.equal('Link Inventory');
  });

  it('should have columns selection filter containing all the columns', () => {
    sandbox.stub(UserStore, 'getById').returns(user);
    sandbox.stub(ContainerStore, 'getByIds').returns(containerData.data);
    wrapper = getTestComponent('12345')
      .setState({ loading: false });
    const list = wrapper.find('List').dive();
    const columnSelectionButton = list.find('.fas').first();
    columnSelectionButton.simulate('click');
    const columnFilter = list.find({ isMultiSelect: true }).dive().find({ groupName: 'column_filter' });
    const optionsList = columnFilter.dive().find('CheckboxGroup').dive().find('Checkbox');

    expect(optionsList.at(0).dive().find('TextBody').dive()
      .find('Text')
      .dive()
      .find('p')
      .text()).to.equal('type');
    expect(optionsList.at(1).dive().find('TextBody').dive()
      .find('Text')
      .dive()
      .find('p')
      .text()).to.equal('format');
    expect(optionsList.at(2).dive().find('TextBody').dive()
      .find('Text')
      .dive()
      .find('p')
      .text()).to.equal('name');
    expect(optionsList.at(3).dive().find('TextBody').dive()
      .find('Text')
      .dive()
      .find('p')
      .text()).to.equal('id');
    expect(optionsList.at(4).dive().find('TextBody').dive()
      .find('Text')
      .dive()
      .find('p')
      .text()).to.equal('barcode');
    expect(optionsList.at(5).dive().find('TextBody').dive()
      .find('Text')
      .dive()
      .find('p')
      .text()).to.equal('contents');
    expect(optionsList.at(6).dive().find('TextBody').dive()
      .find('Text')
      .dive()
      .find('p')
      .text()).to.equal('condition');
    expect(optionsList.at(7).dive().find('TextBody').dive()
      .find('Text')
      .dive()
      .find('p')
      .text()).to.equal('created');
    expect(optionsList.at(8).dive().find('TextBody').dive()
      .find('Text')
      .dive()
      .find('p')
      .text()).to.equal('last used');
    expect(optionsList.at(9).dive().find('TextBody').dive()
      .find('Text')
      .dive()
      .find('p')
      .text()).to.equal('organization');
    expect(optionsList.at(10).dive().find('TextBody').dive()
      .find('Text')
      .dive()
      .find('p')
      .text()).to.equal('created by');
  });

  it('should allow toggling of columns', () => {
    sandbox.stub(UserStore, 'getById').returns(user);
    sandbox.stub(ContainerStore, 'getByIds').returns(containerData.data);

    wrapper = getTestComponent('12345').setState({
      visibleColumns: ['type', 'barcode', 'id', 'name'],
      loading: false
    });
    const list = wrapper.find('List').dive();
    let tableColumns = list.find('Table').find('Column');
    expect(tableColumns.length).to.equal(4);

    wrapper.setState({
      visibleColumns: ['type', 'barcode', 'id', 'name', 'condition']
    });
    const updatedList = wrapper.find('List').dive();
    tableColumns = updatedList.find('Table').find('Column');
    expect(tableColumns.length).to.equal(5);

    const columnSelectionButton = updatedList.find('.fas').first();
    columnSelectionButton.simulate('click');
    const columnFilter = updatedList.find({ isMultiSelect: true }).dive().find({ groupName: 'column_filter' });
    const optionsList = columnFilter.dive().find('CheckboxGroup').dive().find('Checkbox');

    expect(optionsList.at(0).dive().find('input[type="checkbox"]').props().checked).to.be.true;
    expect(optionsList.at(1).dive().find('input[type="checkbox"]').props().checked).to.be.false;
    expect(optionsList.at(2).dive().find('input[type="checkbox"]').props().checked).to.be.true;
    expect(optionsList.at(3).dive().find('input[type="checkbox"]').props().checked).to.be.true;
    expect(optionsList.at(4).dive().find('input[type="checkbox"]').props().checked).to.be.true;
    expect(optionsList.at(5).dive().find('input[type="checkbox"]').props().checked).to.be.false;
    expect(optionsList.at(6).dive().find('input[type="checkbox"]').props().checked).to.be.true;
    expect(optionsList.at(7).dive().find('input[type="checkbox"]').props().checked).to.be.false;
    expect(optionsList.at(8).dive().find('input[type="checkbox"]').props().checked).to.be.false;
    expect(optionsList.at(9).dive().find('input[type="checkbox"]').props().checked).to.be.false;
    expect(optionsList.at(10).dive().find('input[type="checkbox"]').props().checked).to.be.false;
  });

  it('should have rows selection filter containing all the rows per page options', () => {
    sandbox.stub(UserStore, 'getById').returns(user);
    sandbox.stub(ContainerStore, 'getByIds').returns(containerData.data);
    wrapper = getTestComponent('12345').setState({ loading: false });

    const list = wrapper.find('List').dive();
    const rowSelectionButton = list.find('.fas').last();
    rowSelectionButton.simulate('click');
    const allRows = list.find('SearchFilterOptions').at(1).dive().find('SingleSelectRow');

    expect(allRows.at(0).dive().find('TextBody').dive()
      .find('Text')
      .dive()
      .find('p')
      .text()).to.equal('10');

    expect(allRows.at(1).dive().find('TextBody').dive()
      .find('Text')
      .dive()
      .find('p')
      .text()).to.equal('25');

    expect(allRows.at(2).dive().find('TextBody').dive()
      .find('Text')
      .dive()
      .find('p')
      .text()).to.equal('50');

    expect(allRows.at(3).dive().find('TextBody').dive()
      .find('Text')
      .dive()
      .find('p')
      .text()).to.equal('100');
  });

  it('should be able to change rows per page', () => {
    sandbox.stub(UserStore, 'getById').returns(user);
    sandbox.stub(ContainerStore, 'getByIds').returns(containerData.data);
    wrapper = getTestComponent('12345').setState({ loading: false });
    expect(wrapper.state().perPage).to.equal(10);

    const list = wrapper.find('List').dive();
    const rowSelectionButton = list.find('.fas').last();
    rowSelectionButton.simulate('click');
    const PageOption = list.find('SearchFilterOptions').at(1).dive().find('SingleSelectRow')
      .at(1)
      .dive()
      .find('li');
    PageOption.simulate('click');

    expect(wrapper.state().perPage).to.equal(25);
  });

  it('should show spinner when data is loading', () => {
    wrapper = getTestComponent('12345');
    const spinner = wrapper.find('Spinner');

    expect(spinner.length).to.equal(1);
  });

  it('should have sortable columns', () => {
    sandbox.stub(ContainerStore, 'getByIds').returns(containerData.data);
    wrapper = getTestComponent('12345').setState({ loading: false });
    const list = wrapper.find('List');
    const columns = list.dive().find('Column');

    expect(columns.at(0).props().sortable).to.equal(true);
    expect(columns.at(1).props().sortable).to.equal(true);
    expect(columns.at(2).props().sortable).to.equal(true);
    expect(columns.at(3).props().sortable).to.equal(false);
    expect(columns.at(4).props().sortable).to.equal(false);
    expect(columns.at(5).props().sortable).to.equal(false);
    expect(columns.at(6).props().sortable).to.equal(true);
    expect(columns.at(7).props().sortable).to.equal(true);
    expect(columns.at(8).props().sortable).to.equal(true);
    expect(columns.at(9).props().sortable).to.equal(true);
    expect(columns.at(10).props().sortable).to.equal(true);
  });

  it('should render expanded row on accordian click', () => {
    sandbox.stub(UserStore, 'getById').returns(user);
    sandbox.stub(ContainerStore, 'getByIds').returns(containerData.data);

    wrapper = getTestComponent('12345').setState({ loading: false });
    wrapper.find(List).dive().find(Table).dive()
      .find(TableLayout.BodyCell)
      .at(0)
      .find('Icon')
      .simulate('click', { stopPropagation: () => undefined });
    const expandedTable = wrapper.find(List).dive().find(Table).dive()
      .find('Row')
      .at(2)
      .find('BodyCell')
      .dive()
      .find('u')
      .dive()
      .find(Table);
    expect(expandedTable.find(Column).length).to.equal(4);
    expect(expandedTable.find(Column).at(0).props().header).to.equal('Well');
    expect(expandedTable.find(Column).at(1).props().header).to.equal('Volume');
    expect(expandedTable.find(Column).at(2).props().header).to.equal('Mass');
    expect(expandedTable.find(Column).at(3).props().header).to.equal('Concentration');
  });

  it('should display aliquot data on expanded row', () => {
    sandbox.stub(UserStore, 'getById').returns(user);
    sandbox.stub(ContainerStore, 'getByIds').returns(containerData.data);
    sandbox.stub(AliquotStore, 'getByContainer').returns(aliquot);
    sandbox.stub(ContainerTypeStore, 'getById').returns(containerType);
    sandbox.stub(AliquotCompoundLinkStore, 'getByAliquotAndCompoundLinkId').returns(aliquotCompoundLinks);

    wrapper = getTestComponent('12345').setState({ loading: false, aliquotIds: { ct1: ['aq1artkx88szdh'] } });
    wrapper.find(List).dive().find(Table).dive()
      .find(TableLayout.BodyCell)
      .at(0)
      .find('Icon')
      .simulate('click', { stopPropagation: () => undefined });
    const expandedTable = wrapper.find(List).dive().find(Table).dive()
      .find('Row')
      .at(2)
      .find('BodyCell')
      .dive()
      .find('u')
      .dive()
      .find(Table)
      .dive();
    expandedTable.setProps({ loaded: true });
    expect(expandedTable.find(TableLayout.BodyCell).at(0).dive().find('td')
      .text()).to.equal('A1');
    expect(expandedTable.find(TableLayout.BodyCell).at(1).dive().find('td')
      .text()).to.equal('725.0 μL');
    expect(expandedTable.find(TableLayout.BodyCell).at(2).dive().find('td')
      .text()).to.equal('20 mg');
    expect(expandedTable.find(TableLayout.BodyCell).at(3).dive().find('td')
      .text()).to.equal('19 mM');
  });

  it('should display N/A for concentration if mass is provided and volume is 0 for aliquot data on expanded row', () => {
    sandbox.stub(UserStore, 'getById').returns(user);
    sandbox.stub(ContainerStore, 'getByIds').returns(containerData.data);
    sandbox.stub(AliquotStore, 'getByContainer').returns(aliquot1);
    sandbox.stub(ContainerTypeStore, 'getById').returns(containerType);
    sandbox.stub(AliquotCompoundLinkStore, 'getByAliquotAndCompoundLinkId').returns(aliquotCompoundLinks1);

    wrapper = getTestComponent('123456').setState({ loading: false, aliquotIds: { ct1: ['aq1artkx88sz'] } });
    wrapper.find(List).dive().find(Table).dive()
      .find(TableLayout.BodyCell)
      .at(0)
      .find('Icon')
      .simulate('click', { stopPropagation: () => undefined });
    const expandedTable = wrapper.find(List).dive().find(Table).dive()
      .find('Row')
      .at(2)
      .find('BodyCell')
      .dive()
      .find('u')
      .dive()
      .find(Table)
      .dive();
    expandedTable.setProps({ loaded: true });
    expect(expandedTable.find(TableLayout.BodyCell).at(3).dive().find('td')
      .text()).to.equal('N/A');
  });

  it('should display "-" for empty concentration if volume is provided for aliquot data on expanded row', () => {
    sandbox.stub(UserStore, 'getById').returns(user);
    sandbox.stub(ContainerStore, 'getByIds').returns(containerData.data);
    sandbox.stub(AliquotStore, 'getByContainer').returns(aliquot2);
    sandbox.stub(ContainerTypeStore, 'getById').returns(containerType);
    sandbox.stub(AliquotCompoundLinkStore, 'getByAliquotAndCompoundLinkId').returns(aliquotCompoundLinks2);

    wrapper = getTestComponent('1234567').setState({ loading: false, aliquotIds: { ct1: ['aq1artkx88'] } });
    wrapper.find(List).dive().find(Table).dive()
      .find(TableLayout.BodyCell)
      .at(0)
      .find('Icon')
      .simulate('click', { stopPropagation: () => undefined });
    const expandedTable = wrapper.find(List).dive().find(Table).dive()
      .find('Row')
      .at(2)
      .find('BodyCell')
      .dive()
      .find('u')
      .dive()
      .find(Table)
      .dive();
    expandedTable.setProps({ loaded: true });
    expect(expandedTable.find(TableLayout.BodyCell).at(3).dive().find('td')
      .text()).to.equal('-');
  });

  it('should call onSortChange with the correct params when sort is performed', () => {
    sandbox.stub(ContainerStore, 'getByIds').returns(containerData.data);

    wrapper = getTestComponent('12345', true).setState({ loading: false });

    const wrapperInstance = wrapper.instance();
    const onSortSpy = sandbox.spy(wrapperInstance, 'onSortChange');
    wrapperInstance.forceUpdate();

    // Sorting on the containerType column header
    const containerTypeHeader = wrapper.find(List).find(Table)
      .find('SortableHeader')
      .at(1)
      .find('.sortable-header');

    containerTypeHeader.simulate('click'); // Initially descending
    expect(onSortSpy.calledWith('container_type_id', 'desc')).to.be.true;

    containerTypeHeader.simulate('click'); // Second click should toggle to ascending
    expect(onSortSpy.calledWith('container_type_id', 'asc')).to.be.true;
  });

  it('should search container with filters', () => {
    const clock = sinon.useFakeTimers();
    const containerSearchSpy = sandbox.spy(ContainerActions, 'search');
    let expectedSearchData =  {
      query: '*',
      search_fields: ['barcode'],
      ignore_score: true,
      page: 1,
      per_page: 10,
      sort_by: 'updated_at',
      sort_desc: true,
      compound_link_id: '12345',
      status: 'all_except_deleted',
      container_type: []
    };

    wrapper = getTestComponent('12345');
    wrapper.setState({ inventoryFilters });
    clock.tick(500);
    expect(containerSearchSpy.calledWith(expectedSearchData)).to.be.true;

    const updatedInventoryFilters = {
      searchContainerType: ['a1-vial'],
      searchFields: ['batch_ids', 'label', 'barcode'],
      query: ''
    };

    wrapper.setState({ inventoryFilters: updatedInventoryFilters });

    expectedSearchData = {
      ...expectedSearchData,
      container_type: updatedInventoryFilters.searchContainerType,
      search_fields: updatedInventoryFilters.searchFields,
    };
    clock.tick(500);
    expect(containerSearchSpy.calledWith(expectedSearchData)).to.be.true;
    clock.restore();
  });

  it('should not search if query is not changed after applying trim', () => {
    const clock = sinon.useFakeTimers();
    const containerSearchSpy = sandbox.spy(ContainerActions, 'search');
    const expectedSearchData =  {
      query: '1234325',
      search_fields: ['barcode'],
      ignore_score: true,
      page: 1,
      per_page: 10,
      sort_by: 'updated_at',
      sort_desc: true,
      compound_link_id: '12345',
      status: 'all_except_deleted',
      container_type: []
    };

    wrapper = getTestComponent('12345');
    expect(containerSearchSpy.calledOnce).to.be.true;
    wrapper.setState({ inventoryFilters: { ...inventoryFilters, query: '  1234325' } });
    clock.tick(500);
    expect(containerSearchSpy.calledWith(expectedSearchData)).to.be.true;

    const updatedInventoryFilters = {
      searchContainerType: [],
      searchFields: ['barcode'],
      query: '  1234325      '
    };

    wrapper.setState({ inventoryFilters: updatedInventoryFilters });

    clock.tick(500);
    expect(containerSearchSpy.calledThrice).to.be.false;
    clock.restore();
  });

  it('should render CompoundInventoryFilters', () => {
    sandbox.stub(ContainerStore, 'getByIds').returns(containerData.data);
    wrapper = getTestComponent('12345').setState({ loading: false });

    const inventoryFilters = wrapper.find(CompoundInventoryFilters);
    expect(inventoryFilters.length).to.equal(1);
  });

  it('should not render CompoundInventoryFilters when we dont have data', () => {
    wrapper = getTestComponent('12345').setState({ loading: false });
    expect(wrapper.find(CompoundInventoryFilters).length).to.equal(0);
  });

  it('should call the AliquotAPI index when we expand a row for the first time', () => {
    sandbox.stub(UserStore, 'getById').returns(user);
    sandbox.stub(ContainerStore, 'getByIds').returns(containerData.data);
    const aliquotAPICall = sandbox.spy(AliquotAPI, 'index');

    wrapper = getTestComponent('12345').setState({ loading: false });
    wrapper.find(List).dive().find(Table).dive()
      .find(TableLayout.BodyCell)
      .at(0)
      .find('Icon')
      .simulate('click', { stopPropagation: () => undefined });

    expect(aliquotAPICall.calledOnce).to.be.true;
  });

  it('should make a API call when scroll reaches the bottom', () => {
    sandbox.stub(UserStore, 'getById').returns(user);
    sandbox.stub(ContainerStore, 'getByIds').returns(containerData.data);
    const aliquotAPICall = sandbox.spy(AliquotAPI, 'index');

    wrapper = getTestComponent('12345').setState({ loading: false });
    wrapper.instance().onScroll({ target: { scrollTop: 20, scrollHeight: 40, clientHeight: 20, id: 'ct1' } });

    expect(aliquotAPICall.calledOnce).to.be.true;
  });

  it('should not make a call to AliquotAPI when data is loaded', () => {
    sandbox.stub(UserStore, 'getById').returns(user);
    sandbox.stub(ContainerStore, 'getByIds').returns(containerData.data);
    const aliquotAPICall = sandbox.spy(AliquotAPI, 'index');
    sandbox.stub(AliquotStore, 'getByContainer').returns(aliquot);

    wrapper = getTestComponent('12345').setState({ loading: false, aliquotIds: { ct1: ['aq1artkx88szdh'] } });
    wrapper.find(List).dive().find(Table).dive()
      .find(TableLayout.BodyCell)
      .at(0)
      .find('Icon')
      .simulate('click', { stopPropagation: () => undefined });

    expect(aliquotAPICall.calledOnce).to.be.false;
  });

  it('should display correct date format for created_at and updated_at columns in container table', () => {
    sandbox.stub(ContainerStore, 'getByIds').returns(containerData.data);
    wrapper = getTestComponent('12345').setState({ loading: false });
    const table = wrapper.find(List).dive().find(Table).dive();
    expect(table.find(BaseTableTypes.Time).at(0).prop('data')).to.equal(containerData.data[0].created_at);
    expect(table.find(BaseTableTypes.Time).at(1).prop('data')).to.equal(containerData.data[0].updated_at);
  });

  it('should sort the aliquots based on well_idx', () => {
    const aliquots = Immutable.fromJS([
      {
        well_idx: 1,
        id: 'aq1artkx88sz',
        volume_ul: '200.0',
        mass_mg: null
      },
      {
        well_idx: 0,
        id: 'aq1artkx88szdh',
        mass_mg: null,
        volume_ul: '100.0'
      }
    ]);
    sandbox.stub(ContainerStore, 'getByIds').returns(containerData.data);
    sandbox.stub(AliquotStore, 'getByContainer').returns(aliquots);
    sandbox.stub(ContainerTypeStore, 'getById').returns(containerType);
    sandbox.stub(AliquotCompoundLinkStore, 'getByAliquotAndCompoundLinkId').returns(aliquotCompoundLinks2);

    wrapper = getTestComponent('12345').setState({
      loading: false,
      aliquotIds: { ct1: ['aq1artkx88szdh', 'aq1artkx88sz'] }
    });

    wrapper.find(List).dive().find(Table).dive()
      .find(TableLayout.BodyCell)
      .at(0)
      .find('Icon')
      .simulate('click', { stopPropagation: () => undefined });
    const expandedTable = wrapper.find(List).dive().find(Table).dive()
      .find('Row')
      .at(2)
      .find('BodyCell')
      .dive()
      .find('u')
      .dive()
      .find(Table)
      .dive();
    expandedTable.setProps({ loaded: true });

    expect(expandedTable.find(TableLayout.Row).at(1).dive().find(TableLayout.BodyCell)
      .at(1)
      .dive()
      .find('td')
      .text()).to.equal('100.0 μL');
    expect(expandedTable.find(TableLayout.Row).at(2).dive().find(TableLayout.BodyCell)
      .at(1)
      .dive()
      .find('td')
      .text()).to.equal('200.0 μL');
  });
});
