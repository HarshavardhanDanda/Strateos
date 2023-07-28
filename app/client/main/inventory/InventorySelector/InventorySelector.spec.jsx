import React from 'react';
import { mount } from 'enzyme';
import { expect } from 'chai';
import sinon from 'sinon';
import Immutable from 'immutable';
import Moment from 'moment';
import { List, Table, Button, Spinner, ZeroState, SearchFilter, DateTime, RadioGroup, Radio } from '@transcriptic/amino';

import FeatureConstants from '@strateos/features';
import rootNode from 'main/state/rootNode';
import ContainerStore from 'main/stores/ContainerStore';
import LabConsumerStore from 'main/stores/LabConsumerStore';
import SessionStore from 'main/stores/SessionStore';
import InventorySelectorHOC, { InventorySelector } from 'main/inventory/InventorySelector';
import ModalActions from 'main/actions/ModalActions';
import FeatureStore from 'main/stores/FeatureStore';
import ContainerTypeStore from 'main/stores/ContainerTypeStore';
import UserStore from 'main/stores/UserStore';
import { simulateAPICallComplete } from 'main/components/SelectorContent/SelectorContentNew.spec';
import InventoryUtil from 'main/inventory/inventory/util/InventoryUtil';
import { getDefaultSearchPerPage } from 'main/util/List';

describe('InventorySelector', () => {
  const sandbox = sinon.createSandbox();
  let page;
  const props = {
    data: [{
      type: 'containers',
      test_mode: true
    }, {
      type: 'containers',
      test_mode: false
    }],
    onRowClick: sandbox.stub(),
    onSelectRow: sandbox.stub(),
    visibleColumns: InventoryUtil.getVisibleColumns()
  };
  const foobar = Immutable.Map({
    id: 'foobar',
    label: 'Loo'
  });
  const bar1 = Immutable.Map({
    id: 'bar1',
    label: 'Loo'
  });
  const mockLabConsumer = (lbcId, orgId) => {
    return { id: `${lbcId}`,
      organization: {
        id: `${orgId}` },
      lab: {
        id: 'lb123'
      }
    };
  };

  afterEach(() => {
    page.unmount();
    sandbox.restore();
  });

  beforeEach(() => {
    sandbox.stub(ContainerStore, '_objects').get(() => {
      return rootNode.sub('containers', Immutable.Map({ foobar, bar1 }));
    });
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.Map({ id: 'org113' }));
    sandbox.stub(LabConsumerStore, 'getAll').returns(Immutable.fromJS([mockLabConsumer('lbc1', 'org113'),  mockLabConsumer('lbc2', 'org113')]));
    sandbox.stub(UserStore, 'getById').returns(Immutable.Map({ id: 'u123' }));
  });

  it('should have TabLayout and Spinner', () => {
    page = mount(<InventorySelectorHOC {...props} hasResults={false} isSearching />);
    expect(page.find('TabLayout')).to.have.lengthOf(1);
    expect(page.find(Spinner)).to.have.lengthOf(1);
  });

  it('should call initialize and load methods when component is mounted', () => {
    const initialize = sandbox.stub(InventorySelector.prototype, 'initialize');
    const load = sandbox.stub(InventorySelector.prototype, 'load');
    page = mount(<InventorySelector {...props} />);
    expect(initialize.calledOnce).to.be.true;
    expect(load.calledOnce).to.be.true;
  });

  it('should have runLabId from store in search options if labId prop is not present', () => {
    sandbox.stub(ContainerTypeStore, 'getContainerTypeIDsByWellCount').returns(Immutable.fromJS(['6-flat', '6-flat-tc']));
    const search = Immutable.fromJS({
      results: [{ id: 'foobar' }]
    });
    const doSearchSpy = sandbox.spy();

    page = mount(
      <InventorySelectorHOC
        {...props}
        hasResults
        search={search}
        actions={{ doSearch: doSearchSpy, initializeStoreState: sandbox.stub(), updateState: sandbox.stub() }}
      />);

    expect(doSearchSpy.lastCall.args[0].runsLabId).to.equal('lb123');
  });

  it('should have runLabId from props in search options if labId prop is present', () => {
    sandbox.stub(ContainerTypeStore, 'getContainerTypeIDsByWellCount').returns(Immutable.fromJS([]));
    const search = Immutable.fromJS({
      results: [{ id: 'foobar' }]
    });
    const doSearchSpy = sandbox.spy();
    const updateState = sandbox.stub();

    page = mount(
      <InventorySelectorHOC
        {...props}
        hasResults
        search={search}
        actions={{ doSearch: doSearchSpy, initializeStoreState: sandbox.stub(), updateState }}
        labId={'lb124kdfk'}
      />);

    expect(doSearchSpy.lastCall.args[0].runsLabId).to.equal('lb124kdfk');
    expect(updateState.args[0][0]).to.deep.equal({
      defaultFilters: {
        containerTypes: []
      }
    });
  });

  it('should set default filters in state', () => {
    sandbox.stub(ContainerTypeStore, 'getContainerTypeIDsByWellCount').returns(Immutable.fromJS(['6-flat', '6-flat-tc']));
    const defaultFilters = {
      containerTypeWellCount: 6
    };
    const search = Immutable.fromJS({
      results: [{ id: 'foobar' }]
    });
    const doSearchSpy = sandbox.spy();
    const updateState = sandbox.stub();

    page = mount(
      <InventorySelectorHOC
        {...props}
        hasResults
        search={search}
        actions={{ doSearch: doSearchSpy, initializeStoreState: sandbox.stub(), updateState }}
        labId={'lb124kdfk'}
        defaultFilters={defaultFilters}
      />);

    expect(doSearchSpy.lastCall.args[0].runsLabId).to.equal('lb124kdfk');
    expect(updateState.args[0][0]).to.deep.equal({
      defaultFilters: {
        containerTypes: ['6-flat', '6-flat-tc']
      }
    });
  });

  it('should have a sidebar', () => {
    const search = Immutable.fromJS({
      results: [{ id: 'foobar' }]
    });

    page = mount(
      <InventorySelectorHOC
        {...props}
        hasResults
        search={search}
        isSearching={false}
      />);

    simulateAPICallComplete(page);
    expect(page.find(Spinner)).to.have.lengthOf(0);
    expect(page.find(ZeroState)).to.have.lengthOf(0);
    expect(page.find('SearchResultsSidebar')).to.have.lengthOf(1);
  });

  it('should have search field', () => {
    const search = Immutable.fromJS({
      results: [{ id: 'foobar' }]
    });
    page = mount(
      <InventorySelectorHOC
        {...props}
        hasResults
        search={search}
        isSearching={false}
      />);

    simulateAPICallComplete(page);
    const SearchResultsSidebar = page.find('SearchResultsSidebar');
    const containerSearchFilters = SearchResultsSidebar.find('ContainerSearchFilters');
    const searchField = containerSearchFilters.find('SearchFilterBar').find('SearchFilterWrapper').at(0)
      .find('SearchField');
    expect(searchField).to.have.length(1);
  });

  it('should have status search filter and options', () => {
    const search = Immutable.fromJS({
      results: [{ id: 'foobar' }]
    });
    page = mount(
      <InventorySelectorHOC
        {...props}
        hasResults
        search={search}
      />);

    simulateAPICallComplete(page);
    const SearchResultsSidebar = page.find('SearchResultsSidebar');
    const ContainerSearchFilters = SearchResultsSidebar.find('ContainerSearchFilters');
    const SearchFilterBar = ContainerSearchFilters.find('SearchFilterBar');
    const statusFilter = SearchFilterBar.find(SearchFilter).at(0);
    expect(statusFilter.props().title).to.equal('Status');

    const statusFilterOptions = statusFilter.find('SearchFilterOptions').find(RadioGroup)
      .find(Radio);
    expect(statusFilterOptions).to.have.length(6);
    expect(statusFilterOptions.at(0).prop('label')).to.equal('Available');
    expect(statusFilterOptions.at(1).prop('label')).to.equal('All');
    expect(statusFilterOptions.at(2).prop('label')).to.equal('Pending Destruction');
    expect(statusFilterOptions.at(3).prop('label')).to.equal('Destroyed');
    expect(statusFilterOptions.at(4).prop('label')).to.equal('Returned');
    expect(statusFilterOptions.at(5).prop('label')).to.equal('Pending Return');
  });

  it('should have MultiSelect to select the Container Type', () => {
    const search = Immutable.fromJS({
      results: [{ id: 'foobar' }]
    });
    page = mount(
      <InventorySelectorHOC
        {...props}
        hasResults
        search={search}
      />);

    simulateAPICallComplete(page);
    const SearchResultsSidebar = page.find('SearchResultsSidebar');
    const ContainerSearchFilters = SearchResultsSidebar.find('ContainerSearchFilters');
    expect(ContainerSearchFilters.find('ContainerTypeSelector').length).to.equal(1);
    expect(ContainerSearchFilters.find('ContainerTypeSelector').props().isMultiSelect).to.be.true;
  });

  it('should have aliquot_volume search filter and options', () => {
    const search = Immutable.fromJS({
      results: [{ id: 'foobar' }]
    });
    page = mount(
      <InventorySelectorHOC
        {...props}
        hasResults
        search={search}
      />);

    simulateAPICallComplete(page);
    const SearchResultsSidebar = page.find('SearchResultsSidebar');
    const ContainerSearchFilters = SearchResultsSidebar.find('ContainerSearchFilters');
    const SearchFilterBar = ContainerSearchFilters.find('SearchFilterBar');
    const aliquotVolumeFilter = SearchFilterBar.find(SearchFilter).at(1);
    expect(aliquotVolumeFilter.props().title).to.equal('Aliquot volume');

    const aliquotVolumeFilterOptions = aliquotVolumeFilter.find('SearchFilterOptions');

    expect(aliquotVolumeFilterOptions.prop('options')[0].queryTerm).to.equal('*');
    expect(aliquotVolumeFilterOptions.prop('options')[1].queryTerm.lt).to.equal(15);
    expect(aliquotVolumeFilterOptions.prop('options')[2].queryTerm.lt).to.equal(101);
    expect(aliquotVolumeFilterOptions.prop('options')[2].queryTerm.gt).to.equal(14);
    expect(aliquotVolumeFilterOptions.prop('options')[3].queryTerm.lt).to.equal(1001);
    expect(aliquotVolumeFilterOptions.prop('options')[3].queryTerm.gt).to.equal(99);
    expect(aliquotVolumeFilterOptions.prop('options')[4].queryTerm.gt).to.equal(1000);
  });

  it('should have origin search filter and options', () => {
    const search = Immutable.fromJS({
      results: [{ id: 'foobar' }]
    });
    page = mount(
      <InventorySelectorHOC
        {...props}
        hasResults
        search={search}
      />);

    simulateAPICallComplete(page);
    const SearchResultsSidebar = page.find('SearchResultsSidebar');
    const ContainerSearchFilters = SearchResultsSidebar.find('ContainerSearchFilters');
    const SearchFilterBar = ContainerSearchFilters.find('SearchFilterBar');
    const originFilter = SearchFilterBar.find(SearchFilter).at(2);
    expect(originFilter.props().title).to.equal('Origin');

    const originFilterOptions = originFilter.find('SearchFilterOptions').find('Radio');
    expect(originFilterOptions.at(0).prop('label')).to.equal('All');
    expect(originFilterOptions.at(1).prop('label')).to.equal('Shipment');
    expect(originFilterOptions.at(2).prop('label')).to.equal('Run');
  });

  it('should have storage_condition search filter and options', () => {
    const search = Immutable.fromJS({
      results: [{ id: 'foobar' }]
    });
    page = mount(
      <InventorySelectorHOC
        {...props}
        hasResults
        search={search}
      />);

    simulateAPICallComplete(page);
    const searchResultsSidebar = page.find('SearchResultsSidebar');
    const containerSearchFilters = searchResultsSidebar.find('ContainerSearchFilters');
    const searchFilterBar = containerSearchFilters.find('SearchFilterBar');
    const storageConditionFilter = searchFilterBar.find(SearchFilter).at(3);
    expect(storageConditionFilter.props().title).to.equal('Storage condition');

    const storageConditionFilterOptions = storageConditionFilter.find('SearchFilterOptions');

    expect(storageConditionFilterOptions.prop('options')[0].display).to.equal('All storage');
    expect(storageConditionFilterOptions.prop('options')[1].display).to.equal('Ambient (22 ± 2 °C)');
    expect(storageConditionFilterOptions.prop('options')[2].display).to.equal('4 °C (± 1 °C)');
    expect(storageConditionFilterOptions.prop('options')[3].display).to.equal('–20 °C (± 1 °C)');
    expect(storageConditionFilterOptions.prop('options')[4].display).to.equal('-80 °C (± 1 °C)');
  });

  it('should have option to add custom properties', () => {
    const search = Immutable.fromJS({
      results: [{ id: 'foobar' }]
    });
    page = mount(
      <InventorySelectorHOC
        {...props}
        hasResults
        search={search}
      />);

    simulateAPICallComplete(page);
    const searchResultsSidebar = page.find('SearchResultsSidebar');
    const containerSearchFilters = searchResultsSidebar.find('ContainerSearchFilters');
    const searchFilterBar = containerSearchFilters.find('SearchFilterBar');
    const customPropertyOption = searchFilterBar.find('SearchFilterProperties');
    expect(customPropertyOption).to.have.length(2);
    expect(searchFilterBar.find('SearchFilterWrapper').at(10).props().title).to.equal('Container properties');
    expect(searchFilterBar.find('SearchFilterWrapper').at(11).props().title).to.equal('Aliquot properties');
    expect(customPropertyOption.at(0).find('CustomPropertySet')).to.have.length(2);
    expect(customPropertyOption.at(1).find('CustomPropertySet')).to.have.length(2);
  });

  it('should have search results to list the data and Pagination', () => {
    const search = Immutable.fromJS({
      results: [{ id: 'foobar' }]
    });
    page = mount(
      <InventorySelectorHOC
        {...props}
        hasResults
        search={search}
      />);
    simulateAPICallComplete(page);
    const ContainerSearchResults = page.find('ContainerSearchResults');
    expect(ContainerSearchResults).to.have.length(1);
  });

  it('should render ContainerSearchResults with 11 columns', () => {
    const search = Immutable.fromJS({
      results: [{ id: 'foobar' }]
    });
    page = mount(
      <InventorySelectorHOC
        {...props}
        hasResults
        search={search}
        isSearching={false}
      />);
    simulateAPICallComplete(page);
    const ContainerSearchResults = page.find('ContainerSearchResults');
    const table = ContainerSearchResults.find(List).find(Table);
    const columns = table.find('Header').find('Tooltip').filterWhere(t => t.props().title);
    expect(columns).to.have.length(11);
    expect(columns.at(0).props().title).to.equal('type');
    expect(columns.at(1).props().title).to.equal('name');
    expect(columns.at(2).props().title).to.equal('ID');
    expect(columns.at(3).props().title).to.equal('format');
    expect(columns.at(4).props().title).to.equal('contents');
    expect(columns.at(5).props().title).to.equal('condition');
    expect(columns.at(6).props().title).to.equal('created');
    expect(columns.at(7).props().title).to.equal('barcode');
    expect(columns.at(8).props().title).to.equal('Last used');
    expect(columns.at(9).props().title).to.equal('code');
    expect(columns.at(10).props().title).to.equal('creator');
  });

  it('should render ContainerSearchResults with 7 sortable columns', () => {
    const search = Immutable.fromJS({
      results: [{ id: 'foobar' }]
    });
    page = mount(
      <InventorySelectorHOC
        {...props}
        hasResults
        search={search}
        isSearching={false}
      />);
    simulateAPICallComplete(page);
    const ContainerSearchResults = page.find('ContainerSearchResults');
    const table = ContainerSearchResults.find(List).find(Table);
    const sortableColumns = table.find('SortableHeader');

    expect(sortableColumns).to.have.length(7);
  });

  it('should render ContainerSearchResults with content in columns', () => {
    const search = Immutable.fromJS({
      results: [{ id: 'foobar' }]
    });
    page = mount(
      <InventorySelectorHOC
        {...props}
        hasResults
        search={search}
        isSearching={false}
      />);
    simulateAPICallComplete(page);
    const ContainerSearchResults = page.find('ContainerSearchResults');
    const table = ContainerSearchResults.find(List).find(Table);
    const bodyCell = table.find('BodyCell');
    expect(bodyCell.at(8).find(DateTime)
      .text()).to.equal(Moment(new Date()).format('MMM D, YYYY'));
    expect(bodyCell.at(2).find('Tooltip').text()).to.equal('foobar');
  });

  it('should render ContainerSearchResults with test container in columns when testMode is true', () => {
    const search = Immutable.fromJS({
      results: [{ id: 'foobar' }]
    });
    page = mount(
      <InventorySelectorHOC
        {...props}
        hasResults
        search={search}
        testMode
      />);
    simulateAPICallComplete(page);
    const ContainerSearchResults = page.find('ContainerSearchResults');
    const table = ContainerSearchResults.find(List).find(Table);
    expect(table.props().data.size).to.eql(1);
  });

  it('should select container on row select', () => {
    const search = Immutable.fromJS({
      results: [{ id: 'foobar' }]
    });
    const onSelectRow = sinon.spy();
    page = mount(
      <InventorySelectorHOC
        {...props}
        hasResults
        selectionType="CONTAINER+"
        search={search}
        onSelectRow={onSelectRow}
      />);
    simulateAPICallComplete(page);
    const ContainerSearchResults = page.find('ContainerSearchResults');
    const table = ContainerSearchResults.find(List).find(Table);
    expect(table).to.have.length(1);
    const checkbox = table.find('Checkbox');
    const input = checkbox.find('input').at(1);
    input.simulate('change', { target: { checked: 'checked' } });
    expect(onSelectRow.calledOnce).to.equal(true);
  });

  it('should call onSelectAll on clicking masterCheckbox', () => {
    const search = Immutable.fromJS({
      results: [{ id: 'foobar' }]
    });
    const onSelectAll = sinon.spy();
    page = mount(
      <InventorySelectorHOC
        {...props}
        hasResults
        selectionType="CONTAINER+"
        search={search}
        onSelectAll={onSelectAll}
        isSearching={false}
      />);
    simulateAPICallComplete(page);
    const ContainerSearchResults = page.find('ContainerSearchResults');
    const table = ContainerSearchResults.find(List).find(Table);
    expect(table).to.have.length(1);
    const checkbox = table.find('MasterCheckbox').find('Checkbox');
    expect(checkbox).to.have.length(1);
    const input = checkbox.find('input');
    input.simulate('change', { target: { checked: 'checked' } });
    expect(onSelectAll.calledOnce).to.equal(true);
  });

  it('should open Modal to draw Chemical Structure when user clicks Draw Structure link', () => {
    const modalOpenStub = sandbox.stub(ModalActions, 'open').returns({});
    sandbox.stub(FeatureStore, 'hasFeature').withArgs(FeatureConstants.VIEW_COMPOUNDS).returns(true);
    const search = Immutable.fromJS({ results: [foobar] });
    const selected = [];
    const searchOptions = {
      searchAliquotProperties: Immutable.Map(),
      searchContainerProperties: Immutable.Map(),
      searchCustomProperties: Immutable.Map(),
      searchAliquotCustomProperties: Immutable.Map(),
      searchSmiles: '',
      searchInput: '',
      searchQuery: '*',
      searchPage: 1,
      aliquot_count: 1,
      searchSortBy: 'updated_at',
      descending: true,
      bulkSearch: [],
      searchContainerType: [],
      searchStorageCondition: 'all',
      searchRegion: 'all',
      searchPerPage: getDefaultSearchPerPage(),
      searchVolume: '*',
      searchStatus: 'available',
      searchGeneration: '*',
      searchEmptyMass: '{max: "", min: ""}',
      include: [
        'container_type'
      ],
      searchHazard: '[]',
      createdBy: 'all',
      organization_id: 'org13',
      unusedContainers: [],
      generatedContainers: [],
      searchLocation: []
    };
    page = mount(
      <InventorySelectorHOC
        {...props}
        hasResults
        search={search}
        selected={selected}
        searchOptions={searchOptions}
        onRowClick={() => {}}
        onSelectRow={() => {}}
      />);
    simulateAPICallComplete(page);
    const SearchResultsSidebar = page.find('SearchResultsSidebar');
    const ContainerSearchFilters = SearchResultsSidebar.find('ContainerSearchFilters');
    const CompoundsSimilaritySearch = ContainerSearchFilters.find('CompoundsSimilaritySearch');
    CompoundsSimilaritySearch.find(Button).at(0).simulate('click');
    expect(modalOpenStub.calledOnce).to.be.true;
    expect(modalOpenStub.args[0][0]).to.equal('STRUCTURE SEARCH MODAL');
  });

  it('should send isSearching prop as true to ContainerSearchResults when API call is in flight', () => {
    const search = Immutable.fromJS({ results: [foobar] });
    page = mount(
      <InventorySelectorHOC
        {...props}
        hasResults
        search={search}
        isSearching={false}
      />);
    simulateAPICallComplete(page);
    page.setProps({ isSearching: true });
    page.update();
    const containerSearchResults = page.find('ContainerSearchResults');
    expect(containerSearchResults.props().isSearching).to.be.true;
  });

  it('should send isSearching prop as false to ContainerSearchResults when API call has returned', () => {
    const search = Immutable.fromJS({
      results: [{ id: 'foobar' }]
    });
    page = mount(
      <InventorySelectorHOC
        {...props}
        hasResults
        search={search}
        isSearching={false}
      />);
    simulateAPICallComplete(page);
    const containerSearchResults = page.find('ContainerSearchResults');
    expect(containerSearchResults.props().isSearching).to.be.false;
  });

  it('should send defaultFilter prop to ContainerSearchFilters for any preset filters', () => {
    const search = Immutable.fromJS({
      results: [{ id: 'foobar' }]
    });
    const defaultFiltersProp = {
      containerTypeWellCount: 6
    };
    page = mount(
      <InventorySelectorHOC
        {...props}
        hasResults
        search={search}
        isSearching={false}
      />);
    simulateAPICallComplete(page);
    let searchResultsSidebar = page.find('SearchResultsSidebar');
    let containerSearchFilters = searchResultsSidebar.find('ContainerSearchFilters');
    let defaultFilters = containerSearchFilters.props().defaultFilters;
    expect(defaultFilters).to.be.undefined;
    page = mount(
      <InventorySelectorHOC
        {...props}
        hasResults
        search={search}
        defaultFilters={defaultFiltersProp}
        isSearching={false}
      />);
    simulateAPICallComplete(page);
    searchResultsSidebar = page.find('SearchResultsSidebar');
    containerSearchFilters = searchResultsSidebar.find('ContainerSearchFilters');
    defaultFilters = containerSearchFilters.props().defaultFilters;
    expect(defaultFilters).to.deep.equal(defaultFiltersProp);
  });
});
