import sinon from 'sinon';
import { expect } from 'chai';
import ResourceActions from 'main/actions/ResourceActions';
import {
  ResourcesPageState
} from 'main/pages/ResourcesPage/ResourcesState';
import Immutable from 'immutable';
import { ResourcesPageSearchActions } from './ResourcesSearchActions';

describe('ResourcesPageActions', () => {
  let search;
  const sandbox = sinon.createSandbox();

  beforeEach(() => {
    search = sandbox.stub(ResourceActions, 'search').returns({
      done: () => { },
      always: () => { },
      fail: () => { }
    });

    sandbox.stub(ResourcesPageSearchActions, 'search_queue').callsFake(fn => fn());

    sandbox.stub(ResourcesPageState, 'get').returns({
      searchQuery: '*',
      searchPage: 1,
      searchKind: 'all',
      searchStorageCondition: 'all',
      searchPerPage: 6,
      searchSortBy: 'updated_at',
      descending: true
    });

    sandbox.stub(ResourcesPageState, 'set');
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('onSearchInputChange works correctly', () => {
    ResourcesPageSearchActions.onSearchInputChange(() => { }, 'search input');

    expect(search.args[0][0]).to.deep.equal({
      q: 'search input',
      per_page: 6,
      page: 1,
      storage_condition: undefined,
      kind: undefined,
      compound_id: undefined,
      sort_by: 'updated_at',
      sort_desc: true
    });
  });

  it('onSearchPageChange works correctly', () => {
    ResourcesPageSearchActions.onSearchPageChange(() => { }, 4);

    expect(search.args[0][0]).to.deep.equal({
      q: '*',
      per_page: 6,
      page: 4,
      storage_condition: undefined,
      kind: undefined,
      compound_id: undefined,
      sort_by: 'updated_at',
      sort_desc: true
    });
  });

  it('should filter by kind and storage condition', () => {
    ResourcesPageSearchActions.onSearchFilterChange(() => { }, Immutable.Map({ searchKind: 'Reagent' }));

    expect(search.args[0][0]).to.deep.equal({
      q: '*',
      per_page: 6,
      page: 1,
      storage_condition: undefined,
      kind: 'Reagent',
      compound_id: undefined,
      sort_by: 'updated_at',
      sort_desc: true
    });

    search.resetHistory();

    ResourcesPageSearchActions.onSearchFilterChange(() => { }, Immutable.Map({ searchKind: 'Cell', searchStorageCondition: 'cold_4' }));

    expect(search.args[0][0]).to.deep.equal({
      q: '*',
      per_page: 6,
      page: 1,
      storage_condition: 'cold_4',
      kind: 'Cell',
      compound_id: undefined,
      sort_by: 'updated_at',
      sort_desc: true
    });
  });

  it('doSearch work correctly', () => {

    ResourcesPageSearchActions.doSearch({
      searchQuery: '*',
      searchPage: 2,
      searchPerPage: 6,
      searchStorageCondition: 'cold_20',
      searchKind: 'Virus',
      searchSortBy: 'updated_at',
      descending: true
    }, () => {}, () => {});

    expect(search.args[0][0]).to.deep.equal({
      q: '*',
      per_page: 6,
      page: 2,
      storage_condition: 'cold_20',
      kind: 'Virus',
      compound_id: undefined,
      sort_by: 'updated_at',
      sort_desc: true
    });
  });
});
