import React from 'react';
import { shallow, mount } from 'enzyme';
import { expect } from 'chai';
import sinon from 'sinon';
import Immutable from 'immutable';
import { List, Button, SearchFilterWrapper, MoleculeViewer, Toggle, SearchDateFilter,
  SearchFilter, RadioGroup, SearchRangeFilter, SearchField } from '@transcriptic/amino';

import AcsControls from 'main/util/AcsControls';
import FeatureConstants from '@strateos/features';
import ContainerStore from 'main/stores/ContainerStore';
import FeatureStore from 'main/stores/FeatureStore';
import SessionStore from 'main/stores/SessionStore';
import { PageLayout } from 'main/components/PageLayout';
import { SearchResultsSidebar } from 'main/components/PageWithSearchAndList';
import CompoundsSimilaritySearch from 'main/pages/CompoundsPage/CompoundsSimilaritySearch';
import LabConsumerStore from 'main/stores/LabConsumerStore';
import RunAPI from 'main/api/RunAPI';
import ShippingCartActions from 'main/actions/ShippingCartActions';
import { simulateAPICallComplete } from 'main/components/PageWithSearchAndList/PageWithSearchAndList.spec';
import OrganizationStore from 'main/stores/OrganizationStore';
import BulkSearchLookupModal from 'main/pages/InventoryPage/BulkSearchLookupModal';
import ContainerTypeSelector from 'main/components/ContainerTypeSelector';
import SearchFilterProperties from 'main/components/SearchFilterProperties/SearchFilterProperties';
import ContextualCustomPropertiesConfigActions from 'main/actions/ContextualCustomPropertiesConfigActions';
import LocationSelectorModal from 'main/models/LocationSelectorModal/LocationSelectorModal';
import LocationStore from 'main/stores/LocationStore';
import NotificationActions from 'main/actions/NotificationActions';
import UserStore from 'main/stores/UserStore';
import OrganizationTypeAhead from './OrganizationFilter';
import ContainerSearchResults from './ContainerSearchResults';
import ContainerSearchFilters from './ContainerSearchFilters';
import { InventoryPage } from './InventoryPage';

describe('InventoryPage', () => {
  const sandbox = sinon.createSandbox();
  let page;
  let containerSearchResults;
  let containerSearchFilters;
  const foobar = Immutable.Map({
    aliquot_count: 2,
    container_type_id: '96-pcr',
    organization_id: 'org13',
    status: 'inbound',
    storage_condition: 'cold_4',
    test_mode: true,
    type: 'containers',
    id: 'foobar',
    label: 'Loo',
    lab: null,
    created_at: '2021-03-23T01:59:10.226-07:00'
  });
  const foobar1 = Immutable.Map({
    aliquot_count: 2,
    container_type_id: '96-pcr',
    organization_id: 'org13',
    status: 'inbound',
    storage_condition: 'cold_4',
    test_mode: true,
    type: 'containers',
    id: 'foobar1',
    label: 'Loo',
    lab: Immutable.Map({
      id: 'lb1',
      name: 'lab1'
    }),
    created_at: '2021-03-23T01:59:10.226-07:00'
  });
  const foobar2 = Immutable.Map({
    aliquot_count: 2,
    container_type_id: '96-pcr',
    organization_id: 'org12',
    status: 'inbound',
    storage_condition: 'cold_4',
    test_mode: true,
    type: 'containers',
    id: 'foobar2',
    label: 'Loo',
    lab: Immutable.Map({
      id: 'lb2',
      name: 'lab2'
    }),
    created_at: '2021-03-23T01:59:10.226-07:00'
  });
  const resultUrl = sandbox.stub().returns('/stuff/foobar');
  const selectedOnCurrentPage = sandbox.stub().returns(['foobar']);
  const setShippable = sandbox.stub();
  const onSelectionAcrossPagesChangeSpy = sandbox.spy();
  const actions = {
    updateState: sandbox.stub(),
    initializeStoreState: sandbox.stub(),
    doSearch: sandbox.stub(),
    onSearchSmileChange: sandbox.stub()
  };
  const search = Immutable.fromJS({
    results: [foobar],
    per_page: 10,
    num_pages: 100,
    page: 1
  });
  const onSearchFilterChange = sandbox.stub();
  const onOpenStructureSearchModal = sandbox.stub();
  const onSearchInputChange = sandbox.stub();
  const onSearchPageChange = sandbox.stub();
  const onSortChange = sandbox.stub();
  const onViewDetailsClicked = sandbox.stub();
  const searchOptions = Immutable.fromJS({
    searchLocation: [],
    unusedContainers: [],
    generatedContainers: [],
    searchContainerType: [],
    searchContainerProperties: {},
    searchCustomProperties: {},
    searchAliquotProperties: {},
    searchAliquotCustomProperties: {},
    bulkSearch: [],
    searchVolume: '*',
    searchHazard: [],
    searchEmptyMass: { max: '', min: '' },
    searchSmiles: 'CNCCC'
  });
  const props = {
    hasResults: true,
    isSearching: false,
    search,
    selected: [],
    searchOptions,
    searchPerPage: 10,
    selectedOnCurrentPage,
    setTransferableContainerIds: () => {},
    visibleColumns: ['test'],
    resultUrl,
    actions,
    setShippable,
    page: sandbox.stub().returns(5),
    numPages: sandbox.stub().returns(100),
    pageSize: sandbox.stub().returns(10),
    onSearchFilterChange,
    onOpenStructureSearchModal,
    onSearchInputChange,
    onSearchPageChange,
    onSortChange,
    onViewDetailsClicked,
    zeroStateSearchOptions: { title: 'Zero State' },
    hasCollaboratorOrgs: true,
    canTransferContainer: false,
    allResultIds: sandbox.stub(),
    isShippable: false,
    deleteContainersInStore: sandbox.stub(),
    showOrgFilter: true,
    history: {},
    createdIds: Immutable.Map(),
    shipments: Immutable.Seq(),
    totalRecordCount: 1000,
    onSelectionAcrossPagesChange: onSelectionAcrossPagesChangeSpy,
    onBulkActionClick: () => {},
    listUrl: 'url'
  };

  beforeEach(() => {
    sandbox.stub(RunAPI, 'index').returns({ done: () =>  ({ fail: () => {} }) });
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.fromJS({ id: 'org13', feature_groups: [] }));
    sandbox.stub(UserStore, 'getById').returns(Immutable.Map({ id: 'u123' }));
  });

  afterEach(() => {
    page.unmount();
    sandbox.restore();
    sinon.restore();
    LabConsumerStore._empty();
    setShippable.resetHistory();
    onSelectionAcrossPagesChangeSpy.resetHistory();
  });

  const createPage = extraProps => {
    page = mount(<InventoryPage {...props} {...extraProps} />);
    simulateAPICallComplete(page);
  };

  const createContainerSearchFilters = props => {
    containerSearchFilters = page.find(ContainerSearchFilters);
    if (props) {
      containerSearchFilters.setProps(props);
    }
  };

  const createContainerSearchResults = props => {
    containerSearchResults = page.find(ContainerSearchResults);
    if (props) {
      containerSearchResults.setProps(props);
    }
  };

  it('should call methods in componentDidMount', () => {
    const initialize = sandbox.stub(InventoryPage.prototype, 'initialize');
    const load = sandbox.stub(InventoryPage.prototype, 'load');
    page = shallow(<InventoryPage {...props} />);
    page.instance().componentDidMount();
    expect(initialize.called).to.be.true;
    expect(load.called).to.be.true;
  });

  it('should call search function in actions', () => {
    sandbox.stub(ContainerStore, 'getById').returns(Immutable.Map({ [foobar.get('id')]: foobar }));
    actions.doSearch.resetHistory();
    page = mount(
      <InventoryPage
        {...props}
        hasResults={false}
      />
    );
    expect(actions.doSearch.calledOnce).to.be.true;
  });

  it('should call initializeStoreState', () => {
    sandbox.stub(ContainerStore, 'getById').returns(Immutable.Map({ [foobar.get('id')]: foobar }));
    actions.initializeStoreState.resetHistory();
    page = mount(
      <InventoryPage
        {...props}
        hasResults={false}
      />
    );
    expect(actions.initializeStoreState.calledOnce).to.be.true;
  });

  it('should enable Ship button if isShippable prop is true', () => {
    sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.REQUEST_SAMPLE_RETURN).returns(true);
    createPage({ isShippable: true });
    const list = page.find(ContainerSearchResults).find(List);
    expect(list.find(Button).at(0).text()).to.equal('Ship');
    expect(list.find(Button).at(0).props().disabled).to.be.true;
  });

  it('should disable Ship button if isShippable prop is false', () => {
    sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.REQUEST_SAMPLE_RETURN).returns(true);
    createPage({ isShippable: false });
    const list = page.find(ContainerSearchResults).find(List);
    expect(list.find(Button).at(0).text()).to.equal('Ship');
    expect(list.find(Button).at(0).props().disabled).to.be.true;
  });

  it('should send a list of selected container ids to parent component to check if they are all shippable', () => {
    const selectedRows = { ct123: true, ct456: true };
    sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.REQUEST_SAMPLE_RETURN).returns(true);
    sandbox.stub(ContainerStore, 'getById').returns(foobar);
    createPage({ canTransferContainer: true });
    const containerSearchResults = page.find('ContainerSearchResults');
    containerSearchResults.props().onSelectRow([], true, selectedRows);
    expect(setShippable.args[0][0]).to.deep.equal(['ct123', 'ct456']);
  });

  it('should not have PageLayout if hasPageLayout is undefined', () => {
    page = shallow(
      <InventoryPage
        {...props}
      />
    );
    expect(page.find(PageLayout)).to.have.lengthOf(0);
  });

  it('should have placeholder for container search', () => {
    sandbox.stub(ContainerStore, 'getById').returns(Immutable.Map({ [foobar.get('id')]: foobar }));
    createPage();
    expect(page.find(SearchResultsSidebar).find(ContainerSearchFilters)
      .prop('placeholder')).to.equal('Search by Id, Name or Barcode');
  });

  it('should call prop to open Modal to draw Chemical Structure when user click the Draw structure', () => {
    const modalOpenStub = sandbox.stub().returns({});
    sandbox.stub(FeatureStore, 'hasFeature').withArgs(FeatureConstants.VIEW_COMPOUNDS).returns(true);
    const search = Immutable.fromJS({ results: [foobar1, foobar2] });
    const searchOptions = {
      searchContainerProperties: Immutable.Map(),
      searchAliquotProperties: Immutable.Map(),
      searchCustomProperties: Immutable.Map(),
      searchAliquotCustomProperties: Immutable.Map(),
      bulkSearch: Immutable.List(),
      searchSmiles: '',
      unusedContainers: Immutable.List(),
      generatedContainers: Immutable.List()
    };

    createPage({
      search: search,
      searchOptions: searchOptions,
      onOpenStructureSearchModal: modalOpenStub
    });
    createContainerSearchFilters();
    const compoundFilter = containerSearchFilters.find(CompoundsSimilaritySearch);
    compoundFilter.find(Button).at(0).simulate('click');
    expect(modalOpenStub.calledOnce).to.be.true;
  });

  it('should set props correctly for ContainerSearchFilters', () => {
    sandbox.stub(NotificationActions, 'createNotification');
    const handleSearchSmileChange = sandbox.stub(InventoryPage.prototype, 'handleSearchSmileChange');
    const handleSearchFilterReset = sandbox.stub(InventoryPage.prototype, 'handleSearchFilterReset');
    sandbox.stub(ContainerStore, 'getById').returns(Immutable.Map({ [foobar.get('id')]: foobar }));
    createPage({
      showOrgFilter: true
    });
    createContainerSearchFilters();
    containerSearchFilters.props().onSearchFilterChange();
    expect(onSearchFilterChange.called).to.be.true;
    expect(containerSearchFilters.props().orientation).to.equal('vertical');
    expect(containerSearchFilters.props().searchOptions.toJS()).to.deep.equal(searchOptions.toJS());
    expect(containerSearchFilters.props().showTestFilter).to.exist;
    expect(containerSearchFilters.props().showStatusFilter).to.exist;
    expect(containerSearchFilters.props().showOrgFilter).to.be.true;
    containerSearchFilters.props().drawStructure();
    expect(onOpenStructureSearchModal.called).to.be.true;
    handleSearchSmileChange.resetHistory();
    containerSearchFilters.props().onSearchSmileChange();
    expect(handleSearchSmileChange.calledOnce).to.be.true;
    expect(containerSearchFilters.props().placeholder).to.equal('Search by Id, Name or Barcode');
    onSearchInputChange.resetHistory();
    containerSearchFilters.props().onSearchInputChange();
    expect(onSearchInputChange.calledOnce).to.be.true;
    handleSearchFilterReset.resetHistory();
    containerSearchFilters.props().onSearchFilterReset();
    expect(handleSearchFilterReset.calledOnce).to.be.true;
  });

  it('should not error if selected array has values but new results have not been fetched yet', () => {
    sandbox.stub(ContainerStore, 'getById').returns(
      Immutable.Map({ [foobar.get('id')]: foobar })
    );
    const selected = ['ct1fzgptu8bxgwg'];
    page = shallow(
      <InventoryPage
        {...props}
        selected={selected}
      />
    );
    expect(page.length).to.equal(1);
  });

  it('should set props correctly in ContainerSearchResults', () => {
    sandbox.stub(ContainerStore, 'getById').returns(
      Immutable.Map({ [foobar.get('id')]: foobar })
    );
    sandbox.stub(NotificationActions, 'createNotification');
    const visibleColumns = ['test'];

    createPage({
      visibleColumns: visibleColumns
    });
    createContainerSearchResults();
    expect(containerSearchResults.prop('card')).to.exist;
    expect(containerSearchResults.prop('visibleColumns')).to.deep.equal(['test']);
    expect(containerSearchResults.prop('data').toJS()).to.deep.equal([foobar.toJS()]);
    expect(containerSearchResults.prop('page')).to.equal(5);
    expect(containerSearchResults.prop('numPages')).to.equal(100);
    expect(containerSearchResults.prop('pageSize')).to.equal(10);
    onSearchPageChange.resetHistory();
    containerSearchResults.props().onSearchPageChange();
    expect(onSearchPageChange.calledOnce).to.be.true;
    onSearchFilterChange.resetHistory();
    containerSearchResults.props().onSearchFilterChange();
    expect(onSearchFilterChange.calledOnce).to.be.true;
    onSortChange.resetHistory();
    containerSearchResults.props().onSortChange();
    expect(onSortChange.calledOnce).to.be.true;
  });

  it('should not allow user to transfer containers if there are no collaborator orgs for container transfer', () => {
    const selected = ['foobar'];
    sandbox.stub(ContainerStore, 'getById').returns(Immutable.Map({ [foobar.get('id')]: foobar }));
    createPage({
      selected: selected,
      canTransferContainer: true,
      hasCollaboratorOrgs: false
    });
    createContainerSearchResults();
    expect(containerSearchResults.prop('canTransferContainers')).to.be.false;
  });

  it('should not allow user to transfer containers if feature is not enabled', () => {
    const selected = ['foobar'];
    sandbox.stub(ContainerStore, 'getById').returns(Immutable.Map({ [foobar.get('id')]: foobar }));
    createPage({
      selected: selected,
      canTransferContainer: false,
      hasCollaboratorOrgs: true
    });
    createContainerSearchResults();
    expect(containerSearchResults.prop('canTransferContainers')).to.be.false;
  });

  it('should allow user to transfer containers if there are transferable containers and other permissions criteria are met', () => {
    const selected = ['foobar'];
    sandbox.stub(ContainerStore, 'getById').returns(Immutable.Map({ [foobar.get('id')]: foobar }));
    createPage({
      selected: selected,
      canTransferContainer: true,
      hasCollaboratorOrgs: true,
      transferableContainerIds: ['ct123']
    });
    createContainerSearchResults();
    expect(containerSearchResults.prop('canTransferContainers')).to.be.true;
  });

  it('should not allow user to transfer containers if there are no transferable containers even if permissions criteria are met', () => {
    const selected = ['foobar'];
    sandbox.stub(ContainerStore, 'getById').returns(
      Immutable.Map({ [foobar.get('id')]: foobar })
    );
    createPage({
      selected: selected,
      canTransferContainer: false,
      hasCollaboratorOrgs: true,
      transferableContainerIds: []
    });
    createContainerSearchResults();
    expect(containerSearchResults.prop('canTransferContainers')).to.be.false;
  });

  it('should perform necessary tasks when a row checkbox is checked', () => {
    sandbox.stub(ContainerStore, 'getById').returns(Immutable.Map({ [foobar.get('id')]: foobar }));
    sandbox.stub(ShippingCartActions, 'canContainersBeShipped').returns(true);
    const selectedRows = { ct567: true };
    createPage({ selectedOnCurrentPage: sandbox.stub().returns(['foobar']) });
    createContainerSearchResults();
    const onToggleResultSpy = sandbox.stub(page.instance(), 'onToggleResult').returns(true);
    containerSearchResults.props().onSelectRow([], true, selectedRows);
    expect(onToggleResultSpy.calledOnce).to.equal(true);
    expect(setShippable.args[0][0]).to.deep.equal(['ct567']);
  });

  it('should perform necessary tasks when masterCheckbox is checked to select all rows', () => {
    sandbox.stub(ContainerStore, 'getById').returns(Immutable.Map({ [foobar.get('id')]: foobar }));
    sandbox.stub(ShippingCartActions, 'canContainersBeShipped').returns(true);
    const selectedRows = {};
    createPage({ selectedOnCurrentPage: sandbox.stub().returns(['foobar']) });
    createContainerSearchResults();
    const onSelectAllResultsSpy = sandbox.stub(page.instance(), 'onSelectAllResults').returns(true);
    containerSearchResults.props().onSelectAll(selectedRows);
    expect(onSelectAllResultsSpy.calledOnce).to.equal(true);
    expect(setShippable.called).to.be.true;
  });

  it('should perform necessary tasks when masterCheckbox is unchecked to unselect all rows', () => {
    sandbox.stub(ContainerStore, 'getById').returns(Immutable.Map({ [foobar.get('id')]: foobar }));
    sandbox.stub(ShippingCartActions, 'canContainersBeShipped').returns(true);
    const search = Immutable.fromJS({
      results: [{ id: 'foobar' }]
    });
    const selected = ['foobar'];
    const selectedRows = { foobar: true };
    createPage({
      hasResults: true,
      search: search,
      selected: selected,
      selectedOnCurrentPage: sandbox.stub().returns(['foobar']),
      allResultIds: sandbox.stub().returns(Immutable.fromJS(['foobar']))
    });
    createContainerSearchResults();
    containerSearchResults.props().onSelectAll(selectedRows);
    expect(actions.updateState.calledWith({ selected: [] })).to.be.true;
  });

  it('should render ContainerTransferModal', () => {
    const selected = [];
    const search = Immutable.fromJS({
      results: [{ id: 'foobar' }]
    });
    const searchOptions = {
      searchContainerProperties: Immutable.Map(),
      searchAliquotProperties: Immutable.Map(),
      searchCustomProperties: Immutable.Map(),
      searchAliquotCustomProperties: Immutable.Map(),
      searchBarcodes: Immutable.List(),
      searchSmiles: '',
      unusedContainers: Immutable.List(),
      generatedContainers: Immutable.List()
    };

    page = shallow(
      <InventoryPage
        {...props}
        hasResults
        hasPageLayout
        search={search}
        selected={selected}
        searchOptions={searchOptions}
        selectedOnCurrentPage={sandbox.stub().returns(['foobar'])}
      />
    );
    const pageLayout = page.dive().find('PageLayout').dive();

    expect(pageLayout.find('ContainerTransferModal')).to.exist;
  });

  it('should send isSearching prop as true to ContainerSearchResults when API call is in flight', () => {
    createPage({ isSearching: false });
    page.setProps({ isSearching: true });
    page.update();
    createContainerSearchResults();
    expect(containerSearchResults.props().isSearching).to.be.true;
  });

  it('should set correct value for onRowClick in ContainerSearchResults', () => {
    createPage({ isSearching: false });
    createContainerSearchResults();
    containerSearchResults.props().onRowClick();
    expect(onViewDetailsClicked.calledOnce).to.be.true;
  });

  it('should send isSearching prop as false to ContainerSearchResults when API call has returned', () => {
    createPage({ isSearching: false });
    createContainerSearchResults();
    expect(containerSearchResults.props().isSearching).to.be.false;
  });

  it('should set props correctly for PageWithSearchAndList', () => {
    const renderFilters = sandbox.stub(InventoryPage.prototype, 'renderFilters');
    const renderSearchResults = sandbox.stub(InventoryPage.prototype, 'renderSearchResults');
    sandbox.stub(ContainerStore, 'getById').returns(Immutable.Map({ [foobar.get('id')]: foobar }));
    page = shallow(
      <InventoryPage
        {...props}
        searchOptions={Immutable.fromJS({ test: 1 })}
        showOrgFilter
        isSearching={false}
        title={'test'}
        hasPageLayout
        listUrl={'url'}
        zeroStateProps={{ title: 'zero title' }}
      />);

    const pageWithSearchAndList = page.find('PageWithSearchAndList');
    expect(pageWithSearchAndList.props().hasResults).to.be.true;
    expect(pageWithSearchAndList.props().isSearching).to.be.false;
    expect(pageWithSearchAndList.props().extendSidebar).to.be.true;
    expect(pageWithSearchAndList.props().hasPageLayout).to.be.true;
    expect(pageWithSearchAndList.props().title).to.equal('test');
    expect(pageWithSearchAndList.props().listUrl).to.equal('url');
    pageWithSearchAndList.props().renderFilters();
    expect(renderFilters.called).to.be.true;
    pageWithSearchAndList.props().renderSearchResults();
    expect(renderSearchResults.called).to.be.true;
    expect(pageWithSearchAndList.props().zeroStateProps).to.deep.equal({ title: 'zero title' });
  });

  it('should enable selection across pages', () => {
    createPage();
    expect(page.find(ContainerSearchResults).props().enableSelectionAcrossPages).equals(true);
  });

  describe('Selection across pages', () => {
    const selectAllNotificationText1 = 'You have selected 1000 containers';
    const selectAllNotificationText2 = 'You have selected the first 999 of 1000 containers';
    const deselectAllNotificationText = 'Selection of 999 containers has been removed because the results have been modified.';

    const clickSelectAll = (bulkSelectionCount = 999) => {
      page.setProps({ isSelectionAcrossPagesActive: true, bulkSelectionCount });
      containerSearchResults.find(List).props().onSelectionAcrossPagesClick(true, bulkSelectionCount);
      onSelectionAcrossPagesChangeSpy.resetHistory();
    };

    it('should display banner when user selects all across pages', () => {
      const createNotificationSpy = sandbox.spy(NotificationActions, 'createNotification');
      createPage();
      createContainerSearchFilters();
      createContainerSearchResults();
      clickSelectAll(1000);
      expect(createNotificationSpy.args[0][0].text).to.equal(selectAllNotificationText1);
      clickSelectAll(999);
      expect(createNotificationSpy.args[1][0].text).to.equal(selectAllNotificationText2);
    });

    it('should clear selection across pages on container search filter change', () => {
      const createNotificationSpy = sandbox.spy(NotificationActions, 'createNotification');
      createPage();
      createContainerSearchFilters();
      createContainerSearchResults();
      clickSelectAll();
      containerSearchFilters.find(SearchField).at(0).props().onChange({ target: { value: 'test container' } });
      containerSearchFilters.update();
      expect(onSelectionAcrossPagesChangeSpy.calledOnce).to.be.true;
      expect(createNotificationSpy.args[1][0].text).to.equal(deselectAllNotificationText);
    });

    it('should clear selection across pages on container search control box pills change', () => {
      const createNotificationSpy = sandbox.spy(NotificationActions, 'createNotification');
      createPage();
      createContainerSearchFilters();
      createContainerSearchResults();
      clickSelectAll();
      containerSearchFilters.find(SearchFilterWrapper).at(0).props().controlBoxPills.props.onReset();
      containerSearchFilters.update();
      expect(onSelectionAcrossPagesChangeSpy.calledOnce).to.be.true;
      expect(createNotificationSpy.args[1][0].text).to.equal(deselectAllNotificationText);
    });

    it('should clear selection across pages on compound search change', () => {
      const createNotificationSpy = sandbox.spy(NotificationActions, 'createNotification');
      sandbox.stub(FeatureStore, 'hasFeature').withArgs(FeatureConstants.VIEW_COMPOUNDS).returns(true);
      createPage({ searchOptions: searchOptions.set('searchSmiles', '') });
      createContainerSearchFilters();
      createContainerSearchResults();
      clickSelectAll();
      containerSearchFilters.find(CompoundsSimilaritySearch).props().onSearchSimilarityChange();
      containerSearchFilters.update();
      expect(onSelectionAcrossPagesChangeSpy.calledOnce).to.be.true;
      expect(createNotificationSpy.args[1][0].text).to.equal(deselectAllNotificationText);
    });

    it('should clear selection across pages on compound search draw structure change', () => {
      const createNotificationSpy = sandbox.spy(NotificationActions, 'createNotification');
      sandbox.stub(FeatureStore, 'hasFeature').withArgs(FeatureConstants.VIEW_COMPOUNDS).returns(true);
      createPage({ searchOptions: searchOptions.set('searchSmiles', '') });
      createContainerSearchFilters();
      createContainerSearchResults();
      clickSelectAll();
      containerSearchFilters.find(CompoundsSimilaritySearch).props().drawStructure();
      containerSearchFilters.update();
      expect(onSelectionAcrossPagesChangeSpy.calledOnce).to.be.true;
      expect(createNotificationSpy.args[1][0].text).to.equal(deselectAllNotificationText);
    });

    it('should clear selection across pages on molecule viewer change', () => {
      const createNotificationSpy = sandbox.spy(NotificationActions, 'createNotification');
      sandbox.stub(FeatureStore, 'hasFeature').withArgs(FeatureConstants.VIEW_COMPOUNDS).returns(true);
      createPage();
      createContainerSearchFilters();
      createContainerSearchResults();
      clickSelectAll();
      containerSearchFilters.find(MoleculeViewer).props().onChange('searchSmiles');
      containerSearchFilters.update();
      expect(onSelectionAcrossPagesChangeSpy.calledOnce).to.be.true;
      expect(createNotificationSpy.args[1][0].text).to.equal(deselectAllNotificationText);
    });

    it('should clear selection across pages on molecule viewer draw structure change', () => {
      const createNotificationSpy = sandbox.spy(NotificationActions, 'createNotification');
      sandbox.stub(FeatureStore, 'hasFeature').withArgs(FeatureConstants.VIEW_COMPOUNDS).returns(true);
      createPage();
      createContainerSearchFilters();
      createContainerSearchResults();
      clickSelectAll();
      containerSearchFilters.find(MoleculeViewer).props().onExpand();
      containerSearchFilters.update();
      expect(onSelectionAcrossPagesChangeSpy.calledOnce).to.be.true;
      expect(createNotificationSpy.args[1][0].text).to.equal(deselectAllNotificationText);
    });

    it('should clear selection across pages on structure search control box pills change', () => {
      const createNotificationSpy = sandbox.spy(NotificationActions, 'createNotification');
      sandbox.stub(FeatureStore, 'hasFeature').withArgs(FeatureConstants.VIEW_COMPOUNDS).returns(true);
      createPage();
      createContainerSearchFilters();
      createContainerSearchResults();
      clickSelectAll();
      containerSearchFilters.find(SearchFilterWrapper).at(1).props().controlBoxPills.props.onReset();
      containerSearchFilters.update();
      expect(onSelectionAcrossPagesChangeSpy.calledOnce).to.be.true;
      expect(createNotificationSpy.args[1][0].text).to.equal(deselectAllNotificationText);
    });

    it('should clear selection across pages on refine search change', () => {
      const createNotificationSpy = sandbox.spy(NotificationActions, 'createNotification');
      createPage();
      createContainerSearchFilters();
      createContainerSearchResults();
      clickSelectAll();
      containerSearchFilters.find(Toggle).at(0).props().onChange({ target: { value: 'unused' } });
      containerSearchFilters.find(Toggle).at(1).props().onChange({ target: { value: 'generated' } });
      containerSearchFilters.update();
      expect(onSelectionAcrossPagesChangeSpy.calledTwice).to.be.true;
      expect(createNotificationSpy.args[1][0].text).to.equal(deselectAllNotificationText);
    });

    it('should clear selection across pages on refine search control box pills change', () => {
      const createNotificationSpy = sandbox.spy(NotificationActions, 'createNotification');
      createPage({ searchOptions: searchOptions.merge({
        unusedContainers: Immutable.fromJS(['unusedContainers',
          [
            'showUnusedContainers'
          ]]
        ),
        generatedContainers: Immutable.fromJS(['hidePendingContainers'])
      }) });
      createContainerSearchFilters();
      createContainerSearchResults();
      clickSelectAll();
      containerSearchFilters.find(SearchFilterWrapper).at(1).props().controlBoxPills[0].props.onReset();
      containerSearchFilters.find(SearchFilterWrapper).at(1).props().controlBoxPills[1].props.onReset();
      containerSearchFilters.update();
      expect(onSelectionAcrossPagesChangeSpy.calledTwice).to.be.true;
      expect(createNotificationSpy.args[1][0].text).to.equal(deselectAllNotificationText);
    });

    it('should clear selection across pages on bulk search change', () => {
      const createNotificationSpy = sandbox.spy(NotificationActions, 'createNotification');
      createPage();
      createContainerSearchFilters();
      createContainerSearchResults();
      clickSelectAll();
      containerSearchFilters.find(BulkSearchLookupModal).props().onApplyFilter(Immutable.fromJS(['c1', 'c2']));
      containerSearchFilters.update();
      expect(onSelectionAcrossPagesChangeSpy.calledOnce).to.be.true;
      expect(createNotificationSpy.args[1][0].text).to.equal(deselectAllNotificationText);
    });

    it('should clear selection across pages on bulk search control box pills change', () => {
      const createNotificationSpy = sandbox.spy(NotificationActions, 'createNotification');
      createPage({ searchOptions: searchOptions.set('bulkSearch', Immutable.fromJS([
        {
          container_ids: ['c1']
        },
        {
          field: 'barcode'
        }
      ])) });
      createContainerSearchFilters();
      createContainerSearchResults();
      clickSelectAll();
      containerSearchFilters.find(SearchFilterWrapper).at(2).props().controlBoxPills[0].props.onReset();
      containerSearchFilters.find(SearchFilterWrapper).at(2).props().controlBoxPills[1].props.onReset();
      containerSearchFilters.update();
      expect(onSelectionAcrossPagesChangeSpy.calledTwice).to.be.true;
      expect(createNotificationSpy.args[1][0].text).to.equal(deselectAllNotificationText);
    });

    it('should clear selection across pages on org filter change', () => {
      const createNotificationSpy = sandbox.spy(NotificationActions, 'createNotification');
      sandbox.stub(FeatureStore, 'hasFeature').withArgs(FeatureConstants.MANAGE_CONTAINERS_IN_LAB).returns(true);
      createPage({ showOrgFilter: true });
      createContainerSearchFilters();
      createContainerSearchResults();
      clickSelectAll();
      containerSearchFilters.find(OrganizationTypeAhead).props().onOrganizationChange('org1');
      containerSearchFilters.update();
      expect(onSelectionAcrossPagesChangeSpy.calledOnce).to.be.true;
      expect(createNotificationSpy.args[1][0].text).to.equal(deselectAllNotificationText);
    });

    it('should clear selection across pages on org filter control box pill change', () => {
      const createNotificationSpy = sandbox.spy(NotificationActions, 'createNotification');
      sandbox.stub(FeatureStore, 'hasFeature').withArgs(FeatureConstants.MANAGE_CONTAINERS_IN_LAB).returns(true);
      sandbox.stub(OrganizationStore, 'getById').withArgs('org1').returns(Immutable.fromJS({ id: 'org1', name: 'test org' }));
      createPage({
        searchOptions: searchOptions.set('organization_id', 'org1'),
        showOrgFilter: true
      });
      createContainerSearchFilters();
      createContainerSearchResults();
      clickSelectAll();
      containerSearchFilters.find(SearchFilterWrapper).at(3).props().controlBoxPills.props.onReset();
      containerSearchFilters.update();
      expect(onSelectionAcrossPagesChangeSpy.calledOnce).to.be.true;
      expect(createNotificationSpy.args[1][0].text).to.equal(deselectAllNotificationText);
    });

    it('should clear selection across pages on date filter change', () => {
      const createNotificationSpy = sandbox.spy(NotificationActions, 'createNotification');
      const createdAfter = '2022-02-01T18:30:00.000Z';
      const createdBefore = '2022-02-04T18:29:59.999Z';
      createPage({ searchOptions: searchOptions
        .set('createdAfter', createdAfter)
        .set('createdBefore', createdBefore) });
      createContainerSearchFilters();
      createContainerSearchResults();
      clickSelectAll();
      containerSearchFilters.find(SearchDateFilter).at(0).props().onSelect(createdAfter, createdBefore);
      containerSearchFilters.update();
      expect(onSelectionAcrossPagesChangeSpy.calledOnce).to.be.true;
      expect(createNotificationSpy.args[1][0].text).to.equal(deselectAllNotificationText);
    });

    it('should clear selection across pages on container status filter', () => {
      const createNotificationSpy = sandbox.spy(NotificationActions, 'createNotification');
      createPage({ showStatusFilter: true });
      createContainerSearchFilters();
      createContainerSearchResults();
      clickSelectAll();
      containerSearchFilters.find(SearchFilter).at(0).props().onSelectOption();
      containerSearchFilters.update();
      expect(onSelectionAcrossPagesChangeSpy.calledOnce).to.be.true;
      expect(createNotificationSpy.args[1][0].text).to.equal(deselectAllNotificationText);
    });

    it('should clear selection across pages on container type filter change', () => {
      const createNotificationSpy = sandbox.spy(NotificationActions, 'createNotification');
      createPage();
      createContainerSearchFilters();
      createContainerSearchResults();
      clickSelectAll();
      containerSearchFilters.find(ContainerTypeSelector).at(0).props().onChange({ target: { value: 'some container type' } });
      containerSearchFilters.update();
      expect(onSelectionAcrossPagesChangeSpy.calledOnce).to.be.true;
      expect(createNotificationSpy.args[1][0].text).to.equal(deselectAllNotificationText);
    });

    it('should clear selection across pages on container type control box pills change', () => {
      const createNotificationSpy = sandbox.spy(NotificationActions, 'createNotification');
      createPage({ searchOptions: searchOptions.set('searchContainerType', Immutable.fromJS(['plates', 'tubes'])) });
      createContainerSearchFilters();
      createContainerSearchResults();
      clickSelectAll();
      containerSearchFilters.find(SearchFilterWrapper).at(5).props().controlBoxPills[1][0].props.onReset();
      containerSearchFilters.find(SearchFilterWrapper).at(5).props().controlBoxPills[1][1].props.onReset();
      containerSearchFilters.update();
      expect(onSelectionAcrossPagesChangeSpy.calledTwice).to.be.true;
      expect(createNotificationSpy.args[1][0].text).to.equal(deselectAllNotificationText);
    });

    it('should clear selection across pages on aliquot volume filter change', () => {
      const createNotificationSpy = sandbox.spy(NotificationActions, 'createNotification');
      createPage();
      createContainerSearchFilters();
      createContainerSearchResults();
      clickSelectAll();
      containerSearchFilters.find(SearchFilter).at(1).props().onSelectOption();
      containerSearchFilters.update();
      expect(onSelectionAcrossPagesChangeSpy.calledOnce).to.be.true;
      expect(createNotificationSpy.args[1][0].text).to.equal(deselectAllNotificationText);
    });

    it('should clear selection across pages on origin filter change', () => {
      const createNotificationSpy = sandbox.spy(NotificationActions, 'createNotification');
      createPage();
      createContainerSearchFilters();
      createContainerSearchResults();
      clickSelectAll();
      containerSearchFilters.find(SearchFilter).at(2).props().onSelectOption();
      containerSearchFilters.update();
      expect(onSelectionAcrossPagesChangeSpy.calledOnce).to.be.true;
      expect(createNotificationSpy.args[1][0].text).to.equal(deselectAllNotificationText);
    });

    it('should clear selection across pages on storage condition filter change', () => {
      const createNotificationSpy = sandbox.spy(NotificationActions, 'createNotification');
      createPage();
      createContainerSearchFilters();
      createContainerSearchResults();
      clickSelectAll();
      containerSearchFilters.find(SearchFilter).at(3).props().onSelectOption();
      containerSearchFilters.update();
      expect(onSelectionAcrossPagesChangeSpy.calledOnce).to.be.true;
      expect(createNotificationSpy.args[1][0].text).to.equal(deselectAllNotificationText);
    });

    it('should clear selection across pages on creator filter change', () => {
      const createNotificationSpy = sandbox.spy(NotificationActions, 'createNotification');
      createPage();
      createContainerSearchFilters();
      createContainerSearchResults();
      clickSelectAll();
      containerSearchFilters.find(SearchFilter).at(4).props().onSelectOption();
      containerSearchFilters.update();
      expect(onSelectionAcrossPagesChangeSpy.calledOnce).to.be.true;
      expect(createNotificationSpy.args[1][0].text).to.equal(deselectAllNotificationText);
    });

    it('should clear selection across pages on container properties filter change', () => {
      const createNotificationSpy = sandbox.spy(NotificationActions, 'createNotification');
      createPage();
      createContainerSearchFilters();
      createContainerSearchResults();
      clickSelectAll();
      containerSearchFilters.find(SearchFilterProperties).at(0).props().onSelectProperties();
      containerSearchFilters.update();
      expect(onSelectionAcrossPagesChangeSpy.calledOnce).to.be.true;
      expect(createNotificationSpy.args[1][0].text).to.equal(deselectAllNotificationText);
    });

    it('should clear selection across pages on container properties filter control box pills change', () => {
      const createNotificationSpy = sandbox.spy(NotificationActions, 'createNotification');
      sandbox
        .stub(ContextualCustomPropertiesConfigActions, 'loadConfig')
        .returns({
          then: (cb) => {
            cb({
              data: [
                {
                  attributes: {
                    key: 'ccpc key',
                    config_definition: 'test config definition'
                  }
                }
              ]
            });
            return { fail: () => ({}) };
          },
        });
      sandbox.stub(FeatureStore, 'hasFeature').withArgs(FeatureConstants.MANAGE_CONTAINERS_IN_LAB).returns(true);
      createPage({ searchOptions: searchOptions.merge({
        searchCustomProperties: Immutable.fromJS({
          'ccpc key': 'ccpc value'
        }),
        organization_id: 'org1'
      }) });
      createContainerSearchFilters();
      createContainerSearchResults();
      clickSelectAll();
      containerSearchFilters.find(SearchFilterWrapper).at(11).props().controlBoxPills[0].props.onReset();
      containerSearchFilters.update();
      expect(onSelectionAcrossPagesChangeSpy.calledOnce).to.be.true;
      expect(createNotificationSpy.args[1][0].text).to.equal(deselectAllNotificationText);
    });

    it('should clear selection across pages on aliquot properties filter change', () => {
      const createNotificationSpy = sandbox.spy(NotificationActions, 'createNotification');
      createPage();
      createContainerSearchFilters();
      createContainerSearchResults();
      clickSelectAll();
      containerSearchFilters.find(SearchFilterProperties).at(1).props().onSelectProperties();
      containerSearchFilters.update();
      expect(onSelectionAcrossPagesChangeSpy.calledOnce).to.be.true;
      expect(createNotificationSpy.args[1][0].text).to.equal(deselectAllNotificationText);
    });

    it('should clear selection across pages on aliquot properties filter control box pills change', () => {
      const createNotificationSpy = sandbox.spy(NotificationActions, 'createNotification');
      sandbox
        .stub(ContextualCustomPropertiesConfigActions, 'loadConfig')
        .returns({
          then: (cb) => {
            cb({
              data: [
                {
                  attributes: {
                    key: 'ccpc key',
                    config_definition: 'test config definition'
                  }
                }
              ]
            });
            return { fail: () => ({}) };
          },
        });
      sandbox.stub(FeatureStore, 'hasFeature').withArgs(FeatureConstants.MANAGE_CONTAINERS_IN_LAB).returns(true);
      createPage({ searchOptions: searchOptions.merge({
        searchAliquotCustomProperties: Immutable.fromJS({
          'ccpc key': 'ccpc value'
        }),
        organization_id: 'org1'
      }) });
      createContainerSearchFilters();
      createContainerSearchResults();
      clickSelectAll();
      containerSearchFilters.find(SearchFilterWrapper).at(12).props().controlBoxPills[0].props.onReset();
      containerSearchFilters.update();
      expect(onSelectionAcrossPagesChangeSpy.calledOnce).to.be.true;
      expect(createNotificationSpy.args[1][0].text).to.equal(deselectAllNotificationText);
    });

    it('should clear selection across pages on locations filter change', () => {
      const createNotificationSpy = sandbox.spy(NotificationActions, 'createNotification');
      sandbox.stub(FeatureStore, 'hasFeature').withArgs(FeatureConstants.MANAGE_CONTAINERS_IN_LAB).returns(true);
      sandbox.stub(LocationStore, 'getById').withArgs('loc1').returns(Immutable.fromJS({ id: 'loc1' }));
      createPage({ searchOptions: searchOptions.set('searchLocation', Immutable.fromJS([
        {
          id: 'loc1'
        }
      ])) });
      createContainerSearchFilters();
      createContainerSearchResults();
      clickSelectAll();
      containerSearchFilters.find(LocationSelectorModal).props().onLocationSelected('loc1');
      containerSearchFilters.update();
      expect(onSelectionAcrossPagesChangeSpy.calledOnce).to.be.true;
      expect(createNotificationSpy.args[1][0].text).to.equal(deselectAllNotificationText);
    });

    it('should clear selection across pages on locations control box pills change', () => {
      const createNotificationSpy = sandbox.spy(NotificationActions, 'createNotification');
      sandbox.stub(FeatureStore, 'hasFeature').withArgs(FeatureConstants.MANAGE_CONTAINERS_IN_LAB).returns(true);
      createPage({ searchOptions: searchOptions.set('searchLocation', Immutable.fromJS([
        {
          id: 'loc1'
        }
      ])) });
      createContainerSearchFilters();
      createContainerSearchResults();
      clickSelectAll();
      containerSearchFilters.find(SearchFilterWrapper).at(13).props().controlBoxPills[0].props.onReset();
      containerSearchFilters.update();
      expect(onSelectionAcrossPagesChangeSpy.calledOnce).to.be.true;
      expect(createNotificationSpy.args[1][0].text).to.equal(deselectAllNotificationText);
    });

    it('should clear selection across pages on locations toggle change', () => {
      const createNotificationSpy = sandbox.spy(NotificationActions, 'createNotification');
      sandbox.stub(FeatureStore, 'hasFeature').withArgs(FeatureConstants.MANAGE_CONTAINERS_IN_LAB).returns(true);
      createPage({ searchOptions: searchOptions.set('searchLocation', Immutable.fromJS([
        {
          id: 'loc1'
        }
      ])) });
      createContainerSearchFilters();
      createContainerSearchResults();
      clickSelectAll();
      containerSearchFilters.find(RadioGroup).at(5).props().onChange({ target: { value: 'select location only' } });
      containerSearchFilters.update();
      expect(onSelectionAcrossPagesChangeSpy.calledOnce).to.be.true;
      expect(createNotificationSpy.args[1][0].text).to.equal(deselectAllNotificationText);
    });

    it('should clear selection across pages on hazards filter change', () => {
      const createNotificationSpy = sandbox.spy(NotificationActions, 'createNotification');
      sandbox.stub(FeatureStore, 'hasFeature').withArgs(FeatureConstants.MANAGE_CONTAINERS_IN_LAB).returns(true);
      createPage();
      createContainerSearchFilters();
      createContainerSearchResults();
      clickSelectAll();
      containerSearchFilters.find(SearchFilter).at(5).props().onSelectOption();
      containerSearchFilters.update();
      expect(onSelectionAcrossPagesChangeSpy.calledOnce).to.be.true;
      expect(createNotificationSpy.args[1][0].text).to.equal(deselectAllNotificationText);
    });

    it('should clear selection across pages on empty mass filter change', () => {
      const createNotificationSpy = sandbox.spy(NotificationActions, 'createNotification');
      sandbox.stub(FeatureStore, 'hasFeature').withArgs(FeatureConstants.MANAGE_CONTAINERS_IN_LAB).returns(true);
      createPage();
      createContainerSearchFilters();
      createContainerSearchResults();
      clickSelectAll();
      containerSearchFilters.find(SearchRangeFilter).props().onSearchInputChange();
      containerSearchFilters.update();
      expect(onSelectionAcrossPagesChangeSpy.calledOnce).to.be.true;
      expect(createNotificationSpy.args[1][0].text).to.equal(deselectAllNotificationText);
    });

    it('should clear selection across pages on page change', () => {
      const createNotificationSpy = sandbox.spy(NotificationActions, 'createNotification');
      createPage();
      createContainerSearchFilters();
      createContainerSearchResults();
      clickSelectAll();
      page.find(List).props().onPageChange();
      page.update();
      expect(onSelectionAcrossPagesChangeSpy.calledOnce).to.be.true;
      expect(createNotificationSpy.args[1][0].text).to.equal(deselectAllNotificationText);
    });

    it('should clear existing page selection on selection across pages change', () => {
      const updateStateSpy = sandbox.spy();
      createPage({
        selected: ['ct1'],
        actions: { ...actions, updateState: updateStateSpy }
      });
      createContainerSearchResults();
      clickSelectAll();
      expect(updateStateSpy.args[0][0].selected).to.deep.equal([]);
    });
  });
});
