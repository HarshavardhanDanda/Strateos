import React from 'react';
import { mount, shallow } from 'enzyme';
import { expect } from 'chai';
import sinon from 'sinon';
import Immutable from 'immutable';
import { Spinner, ZeroState } from '@transcriptic/amino';

import { SearchResultsSidebar } from 'main/components/PageWithSearchAndList';
import { BatchesPage, props as StateFromStores } from 'main/pages/CompoundsPage/BatchesPage';
import BatchSearchResults from 'main/pages/CompoundsPage/BatchSearchResults';
import BatchSearchFilters from 'main/pages/CompoundsPage/BatchSearchFilters';
import ReactionAPI from 'main/pages/ReactionPage/ReactionAPI';
import BatchStore from 'main/stores/BatchStore';
import { simulateAPICallComplete } from 'main/components/PageWithSearchAndList/PageWithSearchAndList.spec';
import { BatchesSearchDefaults } from 'main/pages/CompoundsPage/BatchesState';
import { getDefaultSearchPerPage } from 'main/util/List';

describe('BatchesPage', () => {
  const sandbox = sinon.createSandbox();
  let wrapper;
  const searchOptions = Immutable.Map({
    searchInput: '',
    searchQuery: '',
    searchField: 'all',
    searchPage: 1,
    searchSortBy: 'created_at',
    descending: true,
    searchPerPage: getDefaultSearchPerPage(),
    synthesisProgram: { id: '', name: '' },
    synthesisRequest: { id: '', name: '' },
    searchPurity: { max: '', min: '', hasError: false },
    searchSimilarity: '',
    searchMassYield: { max: '', min: '', hasError: false }
  });
  const search = Immutable.fromJS({ results: [] });
  const actions = {
    updateState: sandbox.stub(),
    initializeStoreState: sandbox.stub(),
    doSearch: sandbox.stub(),
    onSearchFilterChange: sandbox.stub(),
    onSearchPageChange: sandbox.stub(),
    onSortChange: sandbox.stub(),
    onViewDetailsClicked: sandbox.stub(),
    onSearchInputChange: sandbox.stub(),
    onSearchSimilarityChange: sandbox.stub(),
    hasValidationError: sandbox.stub()
  };
  const onSearchInputChange = sandbox.stub();
  const onSearchPageChange = sandbox.stub();
  const onSortChange = sandbox.stub();
  const onViewDetailsClicked = sandbox.stub();
  const onSearchFilterChange = sandbox.stub();
  const onSearchFailed = sandbox.stub();
  const props = {
    hasResults: true,
    isSearching: false,
    search,
    searchOptions,
    actions,
    onSortChange,
    onSearchInputChange,
    onSearchFilterChange,
    onSearchPageChange,
    onViewDetailsClicked,
    onSearchFailed,
    page: sandbox.stub().returns(1),
    numPages: sandbox.stub().returns(10),
    pageSize: sandbox.stub().returns(15),
    history: {},
    zeroStateSearchOptions: BatchesSearchDefaults
  };

  afterEach(() => {
    sandbox.restore();
    if (wrapper) {
      wrapper.unmount();
    }
  });

  it('should perform initial search', () => {
    actions.doSearch.resetHistory();
    const loadRelatedData = sandbox.stub(BatchesPage.prototype, 'loadRelatedData');
    wrapper = shallow(<BatchesPage {...props} />);
    expect(actions.doSearch.calledOnce).to.be.true;
    expect(actions.doSearch.args[0][0]).to.deep.equal(searchOptions.toJS());
    actions.doSearch.args[0][1]();
    expect(onSearchFailed.calledOnce).to.be.true;
    actions.doSearch.args[0][2]({ test: 1 });
    expect(loadRelatedData.calledOnce).to.be.true;
    expect(loadRelatedData.args[0][0]).to.deep.equal({ test: 1 });
  });

  it('should call Reaction API to get data by Ids', () => {
    const getReactionsByIds = sandbox.stub(ReactionAPI, 'getReactionsByIds');
    const result = {
      data: [
        { attributes: { reaction_id: '123' } },
        { attributes: { reaction_id: '456' } }]
    };
    wrapper = shallow(<BatchesPage {...props} />);
    wrapper.instance().loadRelatedData(result);

    expect(getReactionsByIds.calledOnce).to.be.true;
    expect(getReactionsByIds.args[0][0]).to.deep.equal(['123', '456']);
    expect(getReactionsByIds.args[0][1]).to.be.true;
  });

  it('should have a spinner', () => {
    wrapper = mount(<BatchesPage {...props} />);
    expect(wrapper.find(Spinner).length).equal(1);
  });

  it('should have a zero state', () => {
    const zeroStateProps = {
      title: 'Title'
    };
    wrapper = mount(
      <BatchesPage
        {...props}
        hasResults={false}
        zeroStateProps={zeroStateProps}
      />);
    simulateAPICallComplete(wrapper);

    expect(wrapper.find(Spinner)).to.have.lengthOf(0);
    expect(wrapper.find(ZeroState)).to.have.lengthOf(1);
    expect(wrapper.find(ZeroState).prop('title')).to.equal('Title');
  });

  it('should have filters and list of search results components', () => {
    wrapper = mount(
      <BatchesPage
        {...props}
      />);
    simulateAPICallComplete(wrapper);

    expect(wrapper.find(BatchSearchResults)).to.have.lengthOf(1);
    expect(wrapper.find(SearchResultsSidebar).find(BatchSearchFilters)).to.have.lengthOf(1);
  });

  it('should have BatchSearchFilters with correct props', () => {
    const loadRelatedData = sandbox.stub(BatchesPage.prototype, 'loadRelatedData');
    onSearchFilterChange.resetHistory();
    onSearchInputChange.resetHistory();
    actions.onSearchSimilarityChange.resetHistory();
    onSearchFailed.resetHistory();
    wrapper = mount(
      <BatchesPage
        {...props}
        zeroStateSearchOptions={{ test: 1 }}
      />);
    simulateAPICallComplete(wrapper);

    const batchSearchFilters = wrapper.find(SearchResultsSidebar).find(BatchSearchFilters);
    expect(batchSearchFilters.props().searchOptions.toJS()).to.deep.equal(searchOptions.toJS());

    batchSearchFilters.props().onSearchSimilarityChange('query');
    expect(actions.onSearchSimilarityChange.calledOnce).to.be.true;
    actions.onSearchSimilarityChange.args[0][0]();
    expect(onSearchFailed.calledOnce).to.be.true;
    expect(actions.onSearchSimilarityChange.args[0][1]).to.equal('query');
    actions.onSearchSimilarityChange.args[0][2]();
    expect(loadRelatedData.calledOnce).to.be.true;

    onSearchFailed.resetHistory();
    loadRelatedData.resetHistory();
    batchSearchFilters.props().onSearchFilterChange('query');
    expect(onSearchFilterChange.calledOnce).to.be.true;
    expect(onSearchFilterChange.args[0][0]).to.equal('query');
    onSearchFilterChange.args[0][1]();
    expect(loadRelatedData.calledOnce).to.be.true;

    onSearchFilterChange.resetHistory();
    loadRelatedData.resetHistory();
    batchSearchFilters.props().onSearchFilterReset();
    expect(onSearchFilterChange.calledOnce).to.be.true;
    expect(onSearchFilterChange.args[0][0]).to.deep.equal(Immutable.fromJS({ test: 1 }));
    onSearchFilterChange.args[0][1]();
    expect(loadRelatedData.calledOnce).to.be.true;

    batchSearchFilters.props().onSearchInputChange();
    expect(onSearchInputChange.calledOnce).to.be.true;
  });

  it('should show search results', () => {
    const search = Immutable.fromJS({
      results: [{
        id: 'bat123',
        samples_created_at: '2022-04-22T02:11:21.856-07:00',
        purity: 11,
        post_purification_mass_yield_mg: 1.08,
        created_at: '2022-04-22T01:57:01.116-07:00',
        compound: {
          formula: 'C10H13ClO2S',
          smiles: 'CC(C)(C)c1ccc(S(=O)(=O)Cl)cc1',
        },
        name: 'Result 1',
        pageSize: 12
      }, {
        id: 'bat456',
        samples_created_at: '2021-04-22T02:11:21.856-07:00',
        purity: 11,
        post_purification_mass_yield_mg: 1.4,
        created_at: '2021-04-22T01:57:01.116-07:00',
        compound: {
          formula: 'C10H13ClO2S',
          smiles: 'CC(C)(C)c1ccc',
        },
        name: 'Result 2',
        pageSize: 12
      }]
    });
    wrapper = mount(
      <BatchesPage
        {...props}
        search={search}
      />);
    simulateAPICallComplete(wrapper);

    const list = wrapper.find(BatchSearchResults);
    expect(list.props().data.get(0).getIn(['compound', 'smiles'])).to.equal('CC(C)(C)c1ccc(S(=O)(=O)Cl)cc1');
    expect(list.props().data.get(1).getIn(['compound', 'smiles'])).to.equal('CC(C)(C)c1ccc');
  });

  it('should pass correct props to BatchSearchResults component', () => {
    onSearchFilterChange.resetHistory();
    actions.updateState.resetHistory();
    const loadRelatedData = sandbox.stub(BatchesPage.prototype, 'loadRelatedData');
    const history = { location: { pathname: 'test' } };
    wrapper = mount(
      <BatchesPage
        {...props}
        history={history}
        selected={['bat123']}
      />);
    simulateAPICallComplete(wrapper);

    const searchResults = wrapper.find(BatchSearchResults);
    expect(searchResults.props().data).to.deep.equal(Immutable.fromJS([]));
    expect(searchResults.props().isSearching).to.be.false;
    expect(searchResults.props().searchOptions).to.deep.equal(searchOptions);
    expect(searchResults.props().selected).to.deep.equal({ bat123: true });
    expect(searchResults.props().page).to.equal(1);
    expect(searchResults.props().numPages).to.equal(10);
    expect(searchResults.props().pageSize).to.equal(15);

    searchResults.props().onSearchPageChange('query');
    expect(onSearchPageChange.calledOnce).to.be.true;
    expect(onSearchPageChange.args[0][0]).to.equal('query');
    onSearchPageChange.args[0][1]();
    expect(loadRelatedData.calledOnce).to.be.true;

    loadRelatedData.resetHistory();
    searchResults.props().onSearchFilterChange('query');
    expect(onSearchFilterChange.calledOnce).to.be.true;
    expect(onSearchFilterChange.args[0][0]).to.equal('query');
    onSearchFilterChange.args[0][1]();
    expect(loadRelatedData.calledOnce).to.be.true;

    loadRelatedData.resetHistory();
    searchResults.props().onSortChange('key', 'asc');
    expect(onSortChange.calledOnce).to.be.true;
    expect(onSortChange.args[0][0]).to.equal('key');
    expect(onSortChange.args[0][1]).to.equal('asc');
    onSortChange.args[0][2]();
    expect(loadRelatedData.calledOnce).to.be.true;

    expect(searchResults.props().history).to.equal(history);
    searchResults.props().onSelectRow([]);
    expect(actions.updateState.args[0][0]).to.deep.equal({ selected: [] });
  });

  it('should set props correctly for PageWithSearchAndList', () => {
    const renderFilters = sandbox.stub(BatchesPage.prototype, 'renderFilters');
    const renderSearchResults = sandbox.stub(BatchesPage.prototype, 'renderSearchResults');
    wrapper = shallow(
      <BatchesPage
        {...props}
        zeroStateProps={{ title: 'zero title' }}
        extendSidebar
        hasPageLayout
        history={history}
      />);

    const pageWithSearchAndList = wrapper.find('PageWithSearchAndList');
    expect(pageWithSearchAndList.props().hasResults).to.be.true;
    expect(pageWithSearchAndList.props().isSearching).to.be.false;
    expect(pageWithSearchAndList.props().extendSidebar).to.exist;
    expect(pageWithSearchAndList.props().hasPageLayout).to.be.true;
    expect(pageWithSearchAndList.props().zeroStateProps).to.deep.equal({ title: 'zero title' });
    pageWithSearchAndList.props().renderFilters();
    expect(renderFilters.calledOnce).to.be.true;
    pageWithSearchAndList.props().renderSearchResults();
    expect(renderSearchResults.calledOnce).to.be.true;
  });

  it('should get correct state from stores', () => {
    wrapper = null;
    const materialStore = sandbox.stub(BatchStore, 'getAll').returns(Immutable.fromJS(
      [{ id: 'mat12345', name: 'mat 1' }, { id: 'mat67890', name: 'mat 2' }]));
    let props = StateFromStores();
    expect(props.hasResults).to.be.true;
    materialStore.restore();
    sandbox.stub(BatchStore, 'getAll').returns(Immutable.fromJS([]));
    props = StateFromStores();
    expect(props.hasResults).to.be.false;
  });

  it('should have disableSpinner prop set to true if hasValidationError is true', () => {
    wrapper = shallow(<BatchesPage {...props} />);
    expect(wrapper.find('PageWithSearchAndList').props().disableSpinner).to.be.false;
    const actions = {
      hasValidationError: sandbox.stub().returns(true)
    };
    wrapper = shallow(<BatchesPage {...props} actions={actions} />);
    expect(wrapper.find('PageWithSearchAndList').props().disableSpinner).to.be.true;
  });

  it('should render PageWithSearchAndList as first child to ensure proper page scroll', () => {
    wrapper = shallow(<BatchesPage {...props} />);

    expect(wrapper.find('div').length).to.equal(0);
    expect(wrapper.find('PageWithSearchAndList').length).to.equal(1);
  });
});
