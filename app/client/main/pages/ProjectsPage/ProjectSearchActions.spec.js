import sinon from 'sinon';
import Immutable from 'immutable';
import Urls from 'main/util/urls';
import { expect } from 'chai';
import ProjectActions from 'main/actions/ProjectActions';
import { ProjectFiltersActions } from './ProjectSearchActions';
import { ProjectPageState } from './ProjectPageState';

describe('Project Search Actions', () => {
  const sandbox = sinon.createSandbox();
  let doSearch;

  beforeEach(() => {
    sandbox.stub(Urls, 'organization').returns(Immutable.List(['org17rcd7xzn473', 'org17rcd7xzn472']));
    doSearch = sandbox.stub(ProjectActions, 'search').returns({
      done: () => { },
      always: () => { },
      fail: () => { }
    });
    sandbox.stub(ProjectFiltersActions, 'search_queue').callsFake(fn => fn());
  });

  afterEach(() => {
    sandbox.restore();
  });

  const options = {
    query: 'query',
    is_starred: false,
    per_page: 50,
    page: 1,
    created_at: 'desc',
    is_implementation: false,
    customer_organization_id: undefined
  };

  it('should do search on options passed to onSearchFilterChange', () => {
    ProjectFiltersActions.onSearchFilterChange(() => {}, Immutable.Map(options));
    expect(doSearch.args[0][0].get(0)).to.equal('org17rcd7xzn472');
    expect(doSearch.args[0][1]).to.deep.equal(options);
  });

  it('onSearchFilterChange should always search for page 1', () => {
    const temp = {
      ...options,
      page: 2
    };
    ProjectFiltersActions.onSearchFilterChange(() => {}, Immutable.Map(temp));
    expect(doSearch.args[0][0].get(0)).to.equal('org17rcd7xzn472');
    expect(doSearch.args[0][1]).to.deep.equal(options);
  });

  it('should do search on options passed to doSearch', () => {
    ProjectFiltersActions.doSearch(() => {}, options);
    expect(doSearch.args[0][0].get(0)).to.equal('org17rcd7xzn472');
    expect(doSearch.args[0][1]).to.deep.equal(options);
  });

  it('should not update search input on successful search', () => {
    const updateStateSpy = sandbox.spy(ProjectFiltersActions, 'updateState');
    ProjectFiltersActions.doSearch(() => {}, options);
    expect(doSearch.args[0][1]).to.deep.equal(options);
    expect(ProjectPageState.get().query).to.equal('query');
    expect(updateStateSpy.calledOnceWithExactly({ isSearching: true }));
  });
});
