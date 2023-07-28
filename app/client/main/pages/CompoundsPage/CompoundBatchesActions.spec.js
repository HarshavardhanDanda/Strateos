import sinon from 'sinon';
import { expect } from 'chai';

import BatchAPI from 'main/api/BatchAPI';
import { getDefaultSearchPerPage } from 'main/util/List';
import { CompoundBatchesPageActions } from './CompoundBatchesActions';

describe('CompoundBatchesAction', () => {
  let index;
  const sandbox = sinon.createSandbox();

  beforeEach(() => {
    index = sandbox.stub(BatchAPI, 'index').returns({
      done: () => { },
      always: () => { },
      fail: () => { }
    });

    sandbox.stub(CompoundBatchesPageActions, 'search_queue').callsFake(fn => fn());
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should filter by compound link id', () => {
    CompoundBatchesPageActions.doSearch({
      searchPerPage: getDefaultSearchPerPage(),
      searchPage: '1',
      compound_link_id: 'cmpl1',
      searchInput: ''
    }, () => { }, () => { });

    expect(index.args[0][0]).to.deep.equal({
      filters: {
        compound_link_id: 'cmpl1'
      },
      includes: ['containers'],
      limit: getDefaultSearchPerPage(),
      page: '1',
      sortBy: ['created_at'],
      version: 'v1'
    });
  });

  it('should do a search with a default sort field', () => {
    CompoundBatchesPageActions.doSearch({
      searchPerPage: getDefaultSearchPerPage(),
      searchPage: '1',
      compound_link_id: 'cmpl1',
      searchInput: ''
    }, () => {}, () => {});

    expect(index.args[0][0]).to.deep.equal({
      limit: getDefaultSearchPerPage(),
      page: '1',
      sortBy: ['created_at'],
      filters: {
        compound_link_id: 'cmpl1'
      },
      includes: ['containers'],
      version: 'v1'
    });
  });

  it('should be sortable by fields', () => {
    CompoundBatchesPageActions.doSearch({
      searchInput: '',
      searchPerPage: getDefaultSearchPerPage(),
      searchPage: '1',
      searchSortBy: 'purity',
      descending: true,
      compound_link_id: 'cmpl1',
    }, () => { }, () => { });

    expect(index.args[0][0]).to.deep.equal({
      page: '1',
      limit: getDefaultSearchPerPage(),
      sortBy: ['-purity'],
      filters: {
        compound_link_id: 'cmpl1',
      },
      includes: ['containers'],
      version: 'v1'
    });

    index.resetHistory();

    CompoundBatchesPageActions.doSearch({
      searchInput: '',
      searchPerPage: getDefaultSearchPerPage(),
      searchPage: '1',
      searchSortBy: 'mass',
      descending: false,
      compound_link_id: 'cmpl1'
    }, () => { }, () => { });

    expect(index.args[0][0]).to.deep.equal({
      page: '1',
      limit: getDefaultSearchPerPage(),
      sortBy: ['mass'],
      filters: {
        compound_link_id: 'cmpl1',
      },
      includes: ['containers'],
      version: 'v1'
    });
  });

  it('should filter by batch id', () => {
    CompoundBatchesPageActions.doSearch({
      searchPerPage: getDefaultSearchPerPage(),
      searchPage: '1',
      compound_link_id: 'cmpl1',
      searchInput: 'batch123'
    }, () => { }, () => { });

    expect(index.args[0][0]).to.deep.equal({
      filters: {
        compound_link_id: 'cmpl1',
        id: 'batch123'
      },
      includes: ['containers'],
      limit: getDefaultSearchPerPage(),
      page: '1',
      sortBy: ['created_at'],
      version: 'v1'
    });
  });
});
