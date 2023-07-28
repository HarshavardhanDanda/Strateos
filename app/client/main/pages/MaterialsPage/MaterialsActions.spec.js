import sinon from 'sinon';
import { expect } from 'chai';

import MaterialActions from 'main/actions/MaterialActions';
import { getDefaultSearchPerPage } from 'main/util/List';
import { MaterialsPageActions } from './MaterialsActions';

describe('MaterialsPageActions', () => {
  let search;
  const sandbox = sinon.createSandbox();

  beforeEach(() => {
    search = sandbox.stub(MaterialActions, 'search').returns({
      done: () => { },
      always: () => { },
      fail: () => { }
    });

    sandbox.stub(MaterialsPageActions, 'search_queue').callsFake(fn => fn());
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should do a search with a default sort field', () => {
    MaterialsPageActions.doSearch({
      searchQuery: '',
      searchPerPage: getDefaultSearchPerPage(),
      searchPage: '1'
    }, () => { }, () => { });

    expect(search.args[0][0]).to.deep.equal({
      filters: {
        query: ''
      },
      includes: [
        'vendor',
        'supplier',
        'organization',
        'categories',
        'orderable_materials.orderable_material_components',
        'material_components.resource',
        'material_components.orderable_material_components',
        'orderable_materials.orderable_material_components.container_type'
      ],
      page: '1',
      limit: getDefaultSearchPerPage(),
      sortBy: [
        'created_at'
      ]
    });
  });

  it('should do a search with a query only', () => {
    MaterialsPageActions.doSearch({
      searchQuery: 'strateos',
      searchPerPage: getDefaultSearchPerPage(),
      searchPage: '1'
    }, () => { }, () => { });

    expect(search.args[0][0]).to.deep.equal({
      filters: {
        query: 'strateos'
      },
      includes: [
        'vendor',
        'supplier',
        'organization',
        'categories',
        'orderable_materials.orderable_material_components',
        'material_components.resource',
        'material_components.orderable_material_components',
        'orderable_materials.orderable_material_components.container_type'
      ],
      page: '1',
      limit: getDefaultSearchPerPage(),
      sortBy: [
        'created_at'
      ]
    });
  });

  it('should filter by vendor', () => {
    MaterialsPageActions.doSearch({
      searchQuery: '',
      searchPerPage: getDefaultSearchPerPage(),
      searchPage: '1',
      searchVendor: 'all'
    }, () => { }, () => { });

    expect(search.args[0][0]).to.deep.equal({
      filters: {
        query: ''
      },
      includes: [
        'vendor',
        'supplier',
        'organization',
        'categories',
        'orderable_materials.orderable_material_components',
        'material_components.resource',
        'material_components.orderable_material_components',
        'orderable_materials.orderable_material_components.container_type'
      ],
      page: '1',
      limit: getDefaultSearchPerPage(),
      sortBy: [
        'created_at'
      ]
    });

    search.resetHistory();

    MaterialsPageActions.doSearch({
      searchQuery: '',
      searchPerPage: getDefaultSearchPerPage(),
      searchPage: '1',
      searchVendor: 'vendorId'
    }, () => { }, () => { });

    expect(search.args[0][0]).to.deep.equal({
      filters: {
        query: '',
        vendor_id: 'vendorId'
      },
      includes: [
        'vendor',
        'supplier',
        'organization',
        'categories',
        'orderable_materials.orderable_material_components',
        'material_components.resource',
        'material_components.orderable_material_components',
        'orderable_materials.orderable_material_components.container_type'
      ],
      page: '1',
      limit: getDefaultSearchPerPage(),
      sortBy: [
        'created_at'
      ]
    });
  });

  it('should filter by material type', () => {
    MaterialsPageActions.doSearch({
      searchQuery: '',
      searchPerPage: getDefaultSearchPerPage(),
      searchPage: '1',
      searchType: 'all'
    }, () => { }, () => { });

    expect(search.args[0][0]).to.deep.equal({
      filters: {
        query: ''
      },
      includes: [
        'vendor',
        'supplier',
        'organization',
        'categories',
        'orderable_materials.orderable_material_components',
        'material_components.resource',
        'material_components.orderable_material_components',
        'orderable_materials.orderable_material_components.container_type'
      ],
      page: '1',
      limit: getDefaultSearchPerPage(),
      sortBy: [
        'created_at'
      ]
    });

    search.resetHistory();

    MaterialsPageActions.doSearch({
      searchQuery: '',
      searchPerPage: getDefaultSearchPerPage(),
      searchPage: '1',
      searchType: 'group'
    }, () => { }, () => { });

    expect(search.args[0][0]).to.deep.equal({
      filters: {
        query: '',
        material_type: 'group'
      },
      includes: [
        'vendor',
        'supplier',
        'organization',
        'categories',
        'orderable_materials.orderable_material_components',
        'material_components.resource',
        'material_components.orderable_material_components',
        'orderable_materials.orderable_material_components.container_type'
      ],
      page: '1',
      limit: getDefaultSearchPerPage(),
      sortBy: [
        'created_at'
      ]
    });
  });

  it('should filter by compound', () => {
    MaterialsPageActions.doSearch({
      searchQuery: '',
      searchPerPage: getDefaultSearchPerPage(),
      searchPage: '1',
      searchCompound: 'compoundId'
    }, () => { }, () => { });

    expect(search.args[0][0]).to.deep.equal({
      filters: {
        query: '',
        compound_id: 'compoundId'
      },
      includes: [
        'vendor',
        'supplier',
        'organization',
        'categories',
        'orderable_materials.orderable_material_components',
        'material_components.resource',
        'material_components.orderable_material_components',
        'orderable_materials.orderable_material_components.container_type'
      ],
      page: '1',
      limit: getDefaultSearchPerPage(),
      sortBy: [
        'created_at'
      ]
    });
  });

  it('should be sortable', () => {
    MaterialsPageActions.doSearch({
      searchQuery: '',
      searchPerPage: getDefaultSearchPerPage(),
      searchPage: '1',
      searchSortBy: 'total_ordered',
      descending: true
    }, () => { }, () => { });

    expect(search.args[0][0]).to.deep.equal({
      filters: {
        query: ''
      },
      includes: [
        'vendor',
        'supplier',
        'organization',
        'categories',
        'orderable_materials.orderable_material_components',
        'material_components.resource',
        'material_components.orderable_material_components',
        'orderable_materials.orderable_material_components.container_type'
      ],
      page: '1',
      limit: getDefaultSearchPerPage(),
      sortBy: [
        '-total_ordered'
      ]
    });
  });

  it('should filter by category', () => {
    MaterialsPageActions.doSearch({
      searchQuery: '',
      searchPerPage: getDefaultSearchPerPage(),
      searchPage: '1',
      searchVendor: 'all',
      searchCategory: 'all'
    }, () => { }, () => { });

    expect(search.args[0][0]).to.deep.equal({
      filters: {
        query: ''
      },
      includes: [
        'vendor',
        'supplier',
        'organization',
        'categories',
        'orderable_materials.orderable_material_components',
        'material_components.resource',
        'material_components.orderable_material_components',
        'orderable_materials.orderable_material_components.container_type'
      ],
      page: '1',
      limit: getDefaultSearchPerPage(),
      sortBy: [
        'created_at'
      ]
    });

    search.resetHistory();

    MaterialsPageActions.doSearch({
      searchQuery: '',
      searchPerPage: getDefaultSearchPerPage(),
      searchPage: '1',
      searchVendor: 'vendorId',
      searchCategory: 'categoryId'
    }, () => { }, () => { });

    expect(search.args[0][0]).to.deep.equal({
      filters: {
        query: '',
        vendor_id: 'vendorId',
        category_id: 'categoryId'
      },
      includes: [
        'vendor',
        'supplier',
        'organization',
        'categories',
        'orderable_materials.orderable_material_components',
        'material_components.resource',
        'material_components.orderable_material_components',
        'orderable_materials.orderable_material_components.container_type'
      ],
      page: '1',
      limit: getDefaultSearchPerPage(),
      sortBy: [
        'created_at'
      ]
    });
  });

  it('should filter by cost', () => {
    MaterialsPageActions.doSearch({
      searchQuery: '',
      searchPerPage: getDefaultSearchPerPage(),
      searchPage: '1',
      searchVendor: 'all',
      searchCategory: 'all',
      searchCost: { min: '', max: '' }
    }, () => { }, () => { });

    expect(search.args[0][0]).to.deep.equal({
      filters: {
        query: ''
      },
      includes: [
        'vendor',
        'supplier',
        'organization',
        'categories',
        'orderable_materials.orderable_material_components',
        'material_components.resource',
        'material_components.orderable_material_components',
        'orderable_materials.orderable_material_components.container_type'
      ],
      page: '1',
      limit: getDefaultSearchPerPage(),
      sortBy: [
        'created_at'
      ]
    });

    search.resetHistory();

    MaterialsPageActions.doSearch({
      searchQuery: '',
      searchPerPage: getDefaultSearchPerPage(),
      searchPage: '1',
      searchCost: { min: '20', max: '40' }
    }, () => { }, () => { });

    expect(search.args[0][0]).to.deep.equal({
      filters: {
        query: '',
        cost: { min: '20', max: '40' }
      },
      includes: [
        'vendor',
        'supplier',
        'organization',
        'categories',
        'orderable_materials.orderable_material_components',
        'material_components.resource',
        'material_components.orderable_material_components',
        'orderable_materials.orderable_material_components.container_type'
      ],
      page: '1',
      limit: getDefaultSearchPerPage(),
      sortBy: [
        'created_at'
      ]
    });

    search.resetHistory();

    MaterialsPageActions.doSearch({
      searchQuery: '',
      searchPerPage: getDefaultSearchPerPage(),
      searchPage: '1',
      searchCost: { min: '20', max: '' }
    }, () => { }, () => { });

    expect(search.args[0][0]).to.deep.equal({
      filters: {
        query: '',
        cost: { min: '20' }
      },
      includes: [
        'vendor',
        'supplier',
        'organization',
        'categories',
        'orderable_materials.orderable_material_components',
        'material_components.resource',
        'material_components.orderable_material_components',
        'orderable_materials.orderable_material_components.container_type'
      ],
      page: '1',
      limit: getDefaultSearchPerPage(),
      sortBy: [
        'created_at'
      ]
    });
  });

  it('should not aggregate cost items', () => {
    MaterialsPageActions.doSearch({
      searchQuery: '',
      searchPerPage: getDefaultSearchPerPage(),
      searchPage: '1',
      noAggregation: true
    }, () => { }, () => { });

    expect(search.args[0][0]).to.deep.equal({
      filters: {
        query: ''
      },
      includes: [
        'vendor',
        'supplier',
        'organization',
        'categories',
        'orderable_materials.orderable_material_components',
        'material_components.resource',
        'material_components.orderable_material_components',
        'orderable_materials.orderable_material_components.container_type'
      ],
      custom_params: {
        no_aggregation: true
      },
      page: '1',
      limit: getDefaultSearchPerPage(),
      sortBy: [
        'created_at'
      ]
    });
  });

  it('should filter by smiles', () => {
    MaterialsPageActions.doSearch({
      searchQuery: '',
      searchPerPage: getDefaultSearchPerPage(),
      searchPage: '1',
      searchSmiles: ''
    }, () => { }, () => { });

    expect(search.args[0][0]).to.deep.equal({
      filters: {
        query: '',
        smiles: ''
      },
      includes: [
        'vendor',
        'supplier',
        'organization',
        'categories',
        'orderable_materials.orderable_material_components',
        'material_components.resource',
        'material_components.orderable_material_components',
        'orderable_materials.orderable_material_components.container_type'
      ],
      page: '1',
      limit: getDefaultSearchPerPage(),
      sortBy: [
        'created_at'
      ]
    });

    search.resetHistory();

    MaterialsPageActions.doSearch({
      searchQuery: '',
      searchPerPage: getDefaultSearchPerPage(),
      searchPage: '1',
      searchSmiles: 'NC1cc'
    }, () => { }, () => { });

    expect(search.args[0][0]).to.deep.equal({
      filters: {
        query: '',
        smiles: 'NC1cc'
      },
      includes: [
        'vendor',
        'supplier',
        'organization',
        'categories',
        'orderable_materials.orderable_material_components',
        'material_components.resource',
        'material_components.orderable_material_components',
        'orderable_materials.orderable_material_components.container_type'
      ],
      page: '1',
      limit: getDefaultSearchPerPage(),
      sortBy: [
        'created_at'
      ]
    });
  });
});
