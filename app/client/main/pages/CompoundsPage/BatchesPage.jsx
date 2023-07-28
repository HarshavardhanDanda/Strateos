import React from 'react';
import Immutable from 'immutable';
import _ from 'lodash';
import PropTypes from 'prop-types';

import BatchStore from 'main/stores/BatchStore';
import { BatchSearchStore } from 'main/stores/search';
import PageWithSearchAndList from 'main/components/PageWithSearchAndList/PageWithSearchAndList';
import withPageWithSearchAndList from 'main/components/PageWithSearchAndList/PageWithSearchAndListHOC';
import ConnectToStores from 'main/containers/ConnectToStoresHOC';
import ReactionAPI from 'main/pages/ReactionPage/ReactionAPI';
import BatchSearchResults from 'main/pages/CompoundsPage/BatchSearchResults';
import { BatchesPageState, BatchesSearchDefaults } from 'main/pages/CompoundsPage/BatchesState';
import { BatchesPageActions } from 'main/pages/CompoundsPage/BatchesActions';
import BatchSearchFilters from 'main/pages/CompoundsPage/BatchSearchFilters';

export class BatchesPage extends React.Component  {
  constructor(props) {
    super(props);

    _.bindAll(this,
      'updateSelected',
      'renderSearchResults',
      'renderFilters',
    );
  }

  componentDidMount() {
    this.load();
  }

  load() {
    if (!this.props.actions.doSearch) {
      return;
    }
    const searchOptions = this.props.searchOptions.toJS();
    this.props.actions.doSearch(searchOptions, this.props.onSearchFailed, (result) => {
      this.loadRelatedData(result);
    });
  }

  loadRelatedData(result) {
    const data = result && result.data;
    const reaction_ids = data && _.compact(data.map((record) => record.attributes.reaction_id));
    if (reaction_ids && reaction_ids.length > 0) {
      ReactionAPI.getReactionsByIds(reaction_ids, true);
    }
  }

  updateSelected(selectedRows) {
    this.props.actions.updateState({
      selected: Object.keys(selectedRows)
    });
  }

  getSelectedRows() {
    const selected = {};
    this.props.selected && this.props.selected.forEach(element => {
      selected[element] = true;
    });
    return selected;
  }

  onSearchSimilarityChange(query, onSearchSucceed) {
    this.props.actions.onSearchSimilarityChange(this.props.onSearchFailed, query, onSearchSucceed);
  }

  renderFilters() {
    const { searchOptions, onSearchFilterChange, onSearchInputChange, zeroStateSearchOptions } = this.props;
    return (
      <div>
        <BatchSearchFilters
          searchOptions={searchOptions}
          onSearchSimilarityChange={value => this.onSearchSimilarityChange(value, this.loadRelatedData)}
          onSearchFilterChange={query => onSearchFilterChange(query, this.loadRelatedData)}
          onSearchFilterReset={() => { onSearchFilterChange(Immutable.Map(zeroStateSearchOptions), this.loadRelatedData); }}
          onSearchInputChange={query => onSearchInputChange(query, this.loadRelatedData)}
        />
      </div>
    );
  }

  renderSearchResults() {
    const { searchOptions, isSearching, history, page, numPages, pageSize, onSearchPageChange, onSearchFilterChange, onSortChange } = this.props;
    const records = () => {
      return this.props.search
        .get('results', [])
        .filter(result => result);
    };

    return (
      <BatchSearchResults
        data={records()}
        isSearching={isSearching}
        searchOptions={searchOptions}
        selected={this.getSelectedRows()}
        page={page()}
        numPages={numPages()}
        pageSize={pageSize()}
        onSearchPageChange={searchPage => onSearchPageChange(searchPage, this.loadRelatedData)}
        onSearchFilterChange={options => onSearchFilterChange(options, this.loadRelatedData)}
        onSortChange={(key, direction) => onSortChange(key, direction, this.loadRelatedData)}
        history={history}
        onSelectRow={this.updateSelected}
      />
    );
  }

  render() {
    return (
      <PageWithSearchAndList
        className="batches-page"
        hasResults={this.props.hasResults}
        isSearching={this.props.isSearching}
        disableSpinner={this.props.actions.hasValidationError(this.props.searchOptions.toJS())}
        zeroStateProps={this.props.zeroStateProps}
        hasPageLayout={this.props.hasPageLayout}
        renderFilters={this.renderFilters}
        renderSearchResults={this.renderSearchResults}
        extendSidebar
      />
    );
  }
}

export const props = () => {
  const searchOptions = new Immutable.Map(BatchesPageActions.searchOptions());
  const {
    isSearching,
    selected,
    searchPerPage
  } = BatchesPageState.get();
  const zeroStateProps = {
    title: 'No batches were found.',
  };
  let search = BatchSearchStore.getLatestSearch() || Immutable.fromJS({ results: [] });
  const results = BatchSearchStore.getResultsFromSearch(search);
  search = search.set('results', results);
  const actions = BatchesPageActions;
  const zeroStateSearchOptions = _.merge({}, BatchesSearchDefaults);
  const allResults = BatchStore.getAll();
  const hasResults = allResults && allResults.size > 0;
  const searchZeroStateProps = {
    title: 'No batches were found.'
  };

  return {
    zeroStateProps,
    actions,
    search,
    searchOptions,
    zeroStateSearchOptions,
    hasResults,
    isSearching,
    selected,
    searchPerPage,
    searchZeroStateProps,
    hasPageLayout: false
  };
};

BatchesPage.propTypes = {
  actions: PropTypes.object.isRequired,
  hasPageLayout: PropTypes.bool,
  hasResults: PropTypes.bool.isRequired,
  history: PropTypes.object.isRequired,
  isSearching: PropTypes.bool.isRequired,
  search: PropTypes.instanceOf(Immutable.Map).isRequired,
  searchOptions: PropTypes.object.isRequired,
  searchPerPage: PropTypes.string,
  searchZeroStateProps: PropTypes.object,
  selected: PropTypes.array,
  zeroStateProps: PropTypes.object,
  zeroStateSearchOptions: PropTypes.object.isRequired,
  numPages: PropTypes.func.isRequired,
  onSearchFailed: PropTypes.func,
  onSearchFilterChange: PropTypes.func.isRequired,
  onSearchInputChange: PropTypes.func.isRequired,
  onSearchPageChange: PropTypes.func.isRequired,
  onSortChange: PropTypes.func.isRequired,
  onViewDetailsClicked: PropTypes.func.isRequired,
  page: PropTypes.func.isRequired,
  pageSize: PropTypes.func.isRequired,
};

const batchesPageWithPageWithSearchAndList = withPageWithSearchAndList(BatchesPage);
export default ConnectToStores(batchesPageWithPageWithSearchAndList, props);
