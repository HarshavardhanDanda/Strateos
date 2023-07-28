import React from 'react';
import { expect } from 'chai';
import { shallow, mount } from 'enzyme';
import Immutable from 'immutable';
import sinon from 'sinon';

import { ResourcesPage } from 'main/pages/ResourcesPage';
import { simulateAPICallComplete } from 'main/components/PageWithSearchAndList/PageWithSearchAndList.spec';

describe('ResourcesPage', () => {
  let wrapper;
  const sandbox = sinon.createSandbox();
  const actions = {
    updateState: sinon.stub(),
    doSearch: sinon.stub(),
    initializeStoreState: sinon.stub(),
    onSearchPageChange: sinon.stub()
  };
  const results = [{
    purity: null,
    organization_id: 'org3',
    compound: null,
    name: 'Resource 1',
    material_components: [],
    compound_id: null,
    kind: 'Protein',
    storage_condition: 'cold_20',
    id: 'rs123',
    description: null,
    sensitivities: ['Temperature', 'Light', 'Air']
  }];
  const searchOptions = {
    compoundId: undefined,
    descending: true,
    searchInput: '',
    searchKind: 'all',
    searchPage: 1,
    searchPerPage: '6',
    searchQuery: '*',
    searchSortBy: 'updated_at',
    searchStorageCondition: 'all'
  };
  const search = Immutable.fromJS({
    results: results,
    per_page: 10,
    num_pages: 100,
    page: 1
  });
  const onSearchInputChange = sandbox.stub();
  const onSearchFilterChange = sandbox.stub();
  const onSearchPageChange = sandbox.stub();
  const onSearchFailed = sandbox.stub();
  const props = {
    hasResults: true,
    isSearching: false,
    search: search,
    searchPerPage: '10',
    actions,
    searchOptions,
    zeroStateProps: { title: 'test' },
    page: sandbox.stub().returns(1),
    numPages: sandbox.stub().returns(100),
    onSearchFilterChange,
    onSearchInputChange,
    onSearchPageChange,
    onSearchFailed,
    zeroStateSearchOptions: {}
  };

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
    sandbox.restore();
  });

  it('should call methods in componentDidMount', () => {
    const load = sandbox.stub(ResourcesPage.prototype, 'load');
    wrapper = shallow(<ResourcesPage {...props} />);
    wrapper.instance().componentDidMount();
    expect(load.called).to.be.true;
  });

  it('should render PageWithSearchAndList with correct props', () => {
    const renderFilters = sandbox.stub(ResourcesPage.prototype, 'renderFilters');
    const renderSearchResults = sandbox.stub(ResourcesPage.prototype, 'renderSearchResults');
    const renderPrimaryInfo = sandbox.stub(ResourcesPage.prototype, 'renderPrimaryInfo');
    wrapper = shallow(<ResourcesPage {...props} />);

    const pageWithSearchAndList = wrapper.find('PageWithSearchAndList');
    expect(pageWithSearchAndList).to.exist;
    expect(pageWithSearchAndList.props().hasResults).to.be.true;
    expect(pageWithSearchAndList.props().isSearching).to.be.false;
    expect(pageWithSearchAndList.props().zeroStateProps).to.deep.equal({ title: 'test' });
    pageWithSearchAndList.props().renderFilters();
    expect(renderFilters.called).to.be.true;
    pageWithSearchAndList.props().renderSearchResults();
    expect(renderSearchResults.called).to.be.true;
    pageWithSearchAndList.props().renderPrimaryInfo();
    expect(renderPrimaryInfo.called).to.be.true;
  });

  it('should render ResourcesSearchFilters with correct props', () => {
    const onSearchFilterReset = sandbox.stub(ResourcesPage.prototype, 'onSearchFilterReset');
    wrapper = mount(<ResourcesPage {...props} />);
    simulateAPICallComplete(wrapper);
    const pageWithSearchAndList = wrapper.find('PageWithSearchAndList');
    const resourcesSearchFilters = pageWithSearchAndList.find('SearchResultsSidebar').find('ResourcesSearchFilters');

    resourcesSearchFilters.props().onSearchFilterChange();
    expect(onSearchFilterChange.called).to.be.true;
    expect(resourcesSearchFilters.props().searchOptions.toJS()).to.deep.equal(searchOptions);
    resourcesSearchFilters.props().onSearchInputChange();
    expect(onSearchInputChange.called).to.be.true;
    resourcesSearchFilters.props().onSearchFilterReset();
    expect(onSearchFilterReset.called).to.be.true;
  });

  it('should render ResourcesSearchResults with correct props', () => {
    wrapper = mount(<ResourcesPage {...props} />);
    simulateAPICallComplete(wrapper);
    const pageWithSearchAndList = wrapper.find('PageWithSearchAndList');
    const resourcesSearchResults = pageWithSearchAndList.find('ResourcesSearchResults');

    expect(resourcesSearchResults.props().data.toJS()).to.deep.equal(results);
    expect(resourcesSearchResults.props().page).to.equal(1);
    expect(resourcesSearchResults.props().numPages).to.equal(100);
    resourcesSearchResults.props().onSearchPageChange();
    expect(onSearchPageChange.called).to.be.true;
  });
});
