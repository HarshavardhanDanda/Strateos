import sinon from 'sinon';
import { expect } from 'chai';

import { InventorySearchDefaults, InventoryStateDefaults } from 'main/inventory/inventory/InventoryState';
import UserPreference from 'main/util/UserPreferenceUtil';
import FeatureStore from 'main/stores/FeatureStore';
import FeatureConstants from '@strateos/features';
import InventoryUtil from 'main/inventory/inventory/util/InventoryUtil';
import ContainerActions from 'main/actions/ContainerActions';
import { getDefaultSearchPerPage } from 'main/util/List';
import { InventoryPageActions, InventoryActions, InventorySelectorModalContainerActions } from './InventoryActions';

describe('InventoryActions', () => {
  const inventoryPageDefaults = { ...InventorySearchDefaults, ...InventoryStateDefaults };
  const sandbox = sinon.createSandbox();

  const inventoryPageState = {
    aliquot_count: 0,
    createdBy: 'all',
    descending: true,
    include: ['container_type'],
    organization_id: 'org13',
    searchContainerType: [],
    searchCustomProperties: {},
    searchEmptyMass: { min: '', max: '' },
    searchGeneration: '*',
    searchHazard: [],
    searchInput: '',
    searchPage: 1,
    searchPerPage: getDefaultSearchPerPage(),
    searchProperties: {},
    searchContainerProperties: {},
    searchAliquotProperties: {},
    searchAliquotCustomProperties: {},
    searchQuery: '*',
    searchRegion: 'all',
    searchSmiles: '',
    searchSortBy: 'updated_at',
    searchStatus: 'destroyed',
    searchStorageCondition: 'all',
    searchVolume: '*',
    visibleColumns: ['name', 'barcode', 'format', 'created', 'organization', 'location', 'type', 'ID', 'status', 'contents'],
    createdAfter: null,
    createdBefore: null,
    generatedContainers: [],
    searchLocation: [
      { id: 'loc-1' },
      { id: 'loc-2' },
      { id: 'loc-3', includeDeep: true },
      { id: 'loc-4', includeDeep: true }
    ],
    unusedContainers: [],
  };

  beforeEach(() => {
    sandbox.stub(UserPreference, 'save');
    sandbox.stub(InventoryPageActions, 'search_queue').callsFake((fn: Function) => fn());
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should have 12 columns by default', () => {
    InventoryPageActions.initializeStoreState({ visibleColumns: InventoryUtil.getVisibleColumns() });
    const visibleColumnsInStore = InventoryPageActions.get().visibleColumns;
    expect(visibleColumnsInStore.length).to.equal(12);
    expect(visibleColumnsInStore).to.deep.equals([
      'type',
      'name',
      'ID',
      'format',
      'contents',
      'condition',
      'created',
      'barcode',
      'Last used',
      'creator',
      'code',
      'organization'
    ]);
  });

  it('should have 12 columns by default for non CCS Org', () => {
    sandbox.stub(FeatureStore, 'hasFeature').withArgs(FeatureConstants.MANAGE_CONTAINERS_IN_LAB).returns(false);
    InventoryPageActions.initializeStoreState({ visibleColumns: InventoryUtil.getVisibleColumns() });
    const visibleColumnsInStore = InventoryPageActions.get().visibleColumns;
    expect(visibleColumnsInStore.length).to.equal(12);
    expect(visibleColumnsInStore).to.deep.equals([
      'type',
      'name',
      'ID',
      'format',
      'contents',
      'condition',
      'created',
      'barcode',
      'Last used',
      'creator',
      'code',
      'organization'
    ]);
  });

  it('should have 6 columns by default for operator view', () => {
    const getACS = sandbox.stub(FeatureStore, 'hasFeature');
    getACS.withArgs(FeatureConstants.MANAGE_CONTAINERS_IN_LAB).returns(true);
    InventoryPageActions.initializeStoreState({ visibleColumns: InventoryUtil.getVisibleColumns() });
    const visibleColumnsInStore = InventoryPageActions.get().visibleColumns;
    expect(visibleColumnsInStore.length).to.equal(6);
    expect(visibleColumnsInStore).to.deep.equals(['name', 'barcode', 'format', 'created', 'organization', 'location']);
  });

  it('should get InventoryPageState from local storage if it is there', () => {
    const storeKey = 'inventoryPageStateStore';
    sandbox.stub(UserPreference, 'get').withArgs(storeKey).returns(inventoryPageState);
    const actualInventoryPageState = InventoryPageActions.get();
    expect(actualInventoryPageState).to.deep.equals({ ...inventoryPageDefaults, ...inventoryPageState });
  });

  it('should return InventoryPageState from global state if it is undefined in local storage', () => {
    sandbox.stub(InventoryPageActions.stateStore, 'get').returns(inventoryPageDefaults);
    const storeKey = 'inventoryPageStateStore';
    sandbox.stub(UserPreference, 'get').withArgs(storeKey).returns(null);
    const actualInventoryPageState = InventoryPageActions.get();
    expect(actualInventoryPageState).to.deep.equals({ ...inventoryPageDefaults });
  });

  it('should include location ids in search params if exist', () => {
    const searchSpy = sandbox.spy(ContainerActions, 'search');
    InventoryPageActions.doSearch(inventoryPageState);
    expect(searchSpy.getCall(0).args[0]).to.deep.include({
      locations: ['loc-1', 'loc-2'],
      locations_deep: ['loc-3', 'loc-4']
    });
  });

  it('should build the search payload', () => {
    const expectedPayload =
      {
        query: '*',
        search_fields: ['label', 'id', 'barcode'],
        locations: ['loc-1', 'loc-2'],
        locations_deep: ['loc-3', 'loc-4'],
        per_page: getDefaultSearchPerPage(),
        aliquot_count: 0,
        page: 1,
        sort_by: 'updated_at',
        sort_desc: true,
        hide_tubes: false,
        hide_plates: false,
        show_containers_without_runs: false,
        hide_containers_with_pending_runs: false,
        storage_condition: undefined,
        volume: '*',
        status: 'destroyed',
        contextual_custom_properties: {},
        aliquot_contextual_custom_properties: {},
        container_properties: {},
        aliquot_properties: {},
        shipped: undefined,
        generated: undefined,
        materials: undefined,
        search_score: true,
        include: ['container_type'],
        test_mode: undefined,
        search_hazard: [],
        container_type: [],
        empty_mass: { min: NaN, max: NaN },
        created_by: undefined,
        lab_id: undefined,
        organization_id: 'org13',
        created_after: null,
        created_before: null,
        bulk_search: []
      };
    const actualPayload = InventoryActions.buildSearchPayload(inventoryPageState);
    expect(actualPayload).deep.equal(expectedPayload);
  });

  it('should build the search payload with hide_tubes as true when only All plates is checked', () => {
    const actualPayload = InventoryActions.buildSearchPayload({ ...inventoryPageState, searchContainerType: ['plates'] });
    expect(actualPayload.hide_tubes).to.be.true;
    expect(actualPayload.hide_plates).to.be.false;
  });

  it('should build the search payload with hide_plates as true when only All tubes is checked', () => {
    const actualPayload = InventoryActions.buildSearchPayload({ ...inventoryPageState, searchContainerType: ['tubes'] });
    expect(actualPayload.hide_plates).to.be.true;
    expect(actualPayload.hide_tubes).to.be.false;
  });

  it('should build the search payload with both hide_plates, hide_tubes as false when both All tubes and plates are checked', () => {
    const actualPayload = InventoryActions.buildSearchPayload({ ...inventoryPageState, searchContainerType: ['tubes', 'plates'] });
    expect(actualPayload.hide_tubes).to.be.false;
    expect(actualPayload.hide_plates).to.be.false;
  });

  it('should build the search payload with container_type of the default filter value if no container type is selected by user', () => {
    sandbox.stub(InventorySelectorModalContainerActions.stateStore, 'get').returns({
      defaultFilters: {
        containerTypes: ['a1-vial']
      }
    });
    const actualPayload = InventorySelectorModalContainerActions.buildSearchPayload(inventoryPageState);
    expect(actualPayload.container_type).to.deep.equal(['a1-vial']);
  });

  it('should build the search payload with container_type by overriding the default filter if container types are selected by user', () => {
    sandbox.stub(InventorySelectorModalContainerActions.stateStore, 'get').returns({
      defaultFilters: {
        containerTypes: ['a1-vial', 'a2-vial']
      }
    });
    const actualPayload = InventorySelectorModalContainerActions.buildSearchPayload(
      { ...inventoryPageState, searchContainerType: ['a2-vial'] });
    expect(actualPayload.container_type).to.deep.equal(['a2-vial']);
  });

  it('should build the search payload with container_type as empty if container type is not selected by user and there is no default filter', () => {
    sandbox.stub(InventorySelectorModalContainerActions.stateStore, 'get').returns({});
    const actualPayload = InventorySelectorModalContainerActions.buildSearchPayload(inventoryPageState);
    expect(actualPayload.container_type).to.deep.equal([]);
  });

  it('should capture total record count from search api response', () => {
    sandbox.stub(ContainerActions, 'search').returns({
      done: (cb) => cb({ data: [], meta: { record_count: 5 } }),
      always: () => {},
      fail: () => {}
    });
    InventoryPageActions.doSearch(inventoryPageState);
    expect(InventoryPageActions.get().totalRecordCount).equals(5);
  });
});
