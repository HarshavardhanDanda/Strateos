import sinon from 'sinon';
import { expect } from 'chai';

import MaterialOrderActions from 'main/actions/MaterialOrderActions';
import { getDefaultSearchPerPage } from 'main/util/List';
import { MaterialOrdersPageActions } from './MaterialOrdersActions';
import { MaterialOrdersPageState } from './MaterialOrdersState';

describe('MaterialOrdersPage/MaterialOrdersActions', () => {
  let search;
  const sandbox = sinon.createSandbox();

  beforeEach(() => {
    search = sandbox.stub(MaterialOrderActions, 'search').returns({
      done: (cb) => {
        cb({
          results: [
            { id: 'foo' }
          ]
        });
      },
      always: () => { },
      fail: () => { }
    });
    sandbox.stub(MaterialOrdersPageActions, 'search_queue').callsFake(fn => fn());
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should do a search with a default sort field', () => {
    MaterialOrdersPageActions.doSearch({
      searchField: 'name',
      searchQuery: '',
      searchPerPage: getDefaultSearchPerPage(),
      searchPage: '1',
      searchLab: 'all',
      searchType: 'all',
      searchVendor: 'all',
      activeStatus: []
    }, () => { }, () => { });

    expect(search.args[0][0]).to.deep.equal({
      page: '1',
      per_page: getDefaultSearchPerPage(),
      q: '',
      search_field: 'name',
      sort: 'created_at',
      filter: {
        lab: 'all',
        status: undefined,
        material_type: undefined,
        vendor: undefined
      }
    });
  });

  it('should be able to filter by lab id, type, vendor and status', () => {
    MaterialOrdersPageActions.doSearch({
      searchField: 'name',
      searchQuery: '',
      searchPerPage: getDefaultSearchPerPage(),
      searchPage: '1',
      searchLab: 'lab123',
      searchType: 'group',
      searchVendor: 'ATCC',
      activeStatus: ['arrived']
    }, () => { }, () => { });

    expect(search.args[0][0]).to.deep.equal({
      page: '1',
      per_page: getDefaultSearchPerPage(),
      q: '',
      search_field: 'name',
      sort: 'created_at',
      filter: {
        lab: 'lab123',
        status: 'arrived',
        material_type: 'group',
        vendor: 'ATCC'
      }
    });
  });

  it('should be able to filter by multiple statuses', () => {
    MaterialOrdersPageActions.doSearch({
      searchField: 'name',
      searchQuery: '',
      searchPerPage: getDefaultSearchPerPage(),
      searchPage: '1',
      searchLab: 'all',
      searchType: 'all',
      searchVendor: 'all',
      activeStatus: ['arrived', 'pending', 'purchased']
    }, () => { }, () => { });

    expect(search.args[0][0]).to.deep.equal({
      page: '1',
      per_page: getDefaultSearchPerPage(),
      q: '',
      search_field: 'name',
      sort: 'created_at',
      filter: {
        lab: 'all',
        status: 'arrived,pending,purchased',
        material_type: undefined,
        vendor: undefined
      }
    });
  });

  it('should do a search with a query only', () => {
    MaterialOrdersPageActions.doSearch({
      searchField: 'name',
      searchQuery: 'strateos',
      searchPerPage: getDefaultSearchPerPage(),
      searchPage: '1',
      searchLab: 'all',
      searchType: 'all',
      searchVendor: 'all',
      activeStatus: []
    }, () => { }, () => { });

    expect(search.args[0][0]).to.deep.equal({
      page: '1',
      per_page: getDefaultSearchPerPage(),
      q: 'strateos',
      search_field: 'name',
      sort: 'created_at',
      filter: {
        lab: 'all',
        status: undefined,
        material_type: undefined,
        vendor: undefined
      }
    });
  });

  it('selected should remain same when searched for orders', () => {
    MaterialOrdersPageState.set({
      selected: ['bar', 'foo']
    });

    MaterialOrdersPageActions.doSearch({
      searchQuery: '',
      searchPerPage: getDefaultSearchPerPage(),
      searchPage: '1',
      searchSortBy: 'status',
      searchLab: 'all',
      descending: true
    });

    expect(MaterialOrdersPageState.get().selected).to.deep.equal(['bar', 'foo']);
  });

  it('should be sortable', () => {
    MaterialOrdersPageActions.doSearch({
      searchField: 'name',
      searchQuery: '',
      searchPerPage: getDefaultSearchPerPage(),
      searchPage: '1',
      searchSortBy: 'status',
      searchLab: 'all',
      descending: true
    }, () => { }, () => { });

    expect(search.args[0][0]).to.deep.equal({
      page: '1',
      per_page: getDefaultSearchPerPage(),
      q: '',
      search_field: 'name',
      sort: '-status',
      filter: {
        lab: 'all',
        status: undefined,
        material_type: undefined,
        vendor: undefined
      }
    });
  });
});
