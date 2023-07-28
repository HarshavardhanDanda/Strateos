import Immutable from 'immutable';
import _ from 'lodash';
import React from 'react';
import Classnames from 'classnames';

import {
  Spinner,
  ZeroState
} from '@transcriptic/amino';

import {
  SearchResultsSidebar
} from 'main/components/PageWithSearchAndList';
import { TabLayout } from 'main/components/TabLayout';
import { TabLayoutSidebar } from 'main/components/TabLayout/TabLayout';
import SessionStore from 'main/stores/SessionStore';
import './SelectorContent.scss';

class SelectorContent extends React.Component {

  constructor(props) {
    super(props);
    _.bindAll(
      this,
      'onSearchFailed',
      'onVisibleColumnChange',
      'initializeStoreState'
    );
    this.debouceFetch = _.debounce(this.load, 50).bind(this);
    this.state = {
      statusCode: undefined,
      hasResults: this.props.hasResults,
      hasDoneDefaultSearch: false,
      isLoading: !this.props.hasResults,
      hideSearchBar: false
    };
  }

  componentDidMount() {
    if (this.props.isDrawer) {
      this.debouceFetch();
    } else {
      this.load();
    }
    this.initialize && this.initialize();
  }

  componentWillReceiveProps(nextProps) {
    if (!this.props.hasResults && nextProps.hasResults) {
      this.setState({ hasResults: true, isLoading: false });
    }

    if (
      this.props.isSearching &&
      !nextProps.isSearching &&
      this.state.hasDoneDefaultSearch &&
      !nextProps.hasResults &&
      this.state.isLoading
    ) {
      this.props.actions.doSearch(this.props.zeroStateSearchOptions, this.onSearchFailed, () => {
        this.setState({ isLoading: false });
      });
    }
  }

  componentWillUpdate(nextProps, nextState) {
    // If in the next state the default search is complete, no results have been found, the search is still loading
    // and the store is still searching, then perform a second search for the zero state.
    if (nextState.hasDoneDefaultSearch && !nextProps.hasResults && this.state.isLoading && !nextProps.isSearching) {
      this.props.actions.doSearch(this.props.zeroStateSearchOptions, this.onSearchFailed, () => {
        this.setState({ isLoading: false });
      });
    }
  }

  subdomain() {
    return SessionStore.getOrg().get('subdomain');
  }

  onSearchFailed(xhr) {
    this.setState({ statusCode: xhr.status });
  }

  onSortChange(sortKey, sortDirection, onSearchSucceed) {
    this.setState({ sortKey, sortDirection }, () => {
      const isDescending = this.state.sortDirection === 'desc';
      this.props.actions.onSortOptionChange(this.onSearchFailed, this.state.sortKey, isDescending, onSearchSucceed);
    });
  }

  // Searching the text input by query
  onSearchInputChange(query, onSearchSucceed) {
    this.props.actions.onSearchInputChange(this.onSearchFailed, query, onSearchSucceed);
  }

  onSearchSimilarityChange(query, onSearchSucceed) {
    this.props.actions.onSearchSimilarityChange(this.onSearchFailed, query, onSearchSucceed);
  }

  onVisibleColumnChange(visibleColumns) {
    if (this.props.actions.onVisibleColumnChange) {
      this.props.actions.onVisibleColumnChange(visibleColumns);
    }
  }

  initializeStoreState(state) {
    this.props.actions && this.props.actions.initializeStoreState(state);
  }

  onSearchFilterReset() {
    // OVERRIDE in children class
  }

  // Selecting one of the search option dropdowns
  onSearchFilterChange(options, onSearchSucceed) {
    this.props.actions.onSearchFilterChange(this.onSearchFailed, options, onSearchSucceed);
  }

  // Selecting specific page in paginated results
  onSearchPageChange(searchPage, onSearchSucceed) {
    this.props.actions.onSearchPageChange(this.onSearchFailed, searchPage, onSearchSucceed);
  }

  updateSelected(selectedRows) {
    this.props.actions.updateState({
      selected: _.keys(selectedRows)
    });
  }

  addToSelection(record, selected) {
    this.props.actions.updateState({
      selected: [...selected, record.get('id')]
    });
  }

  showOrHideSearchBar(show) {
    this.setState({ hideSearchBar: !show });
  }

  records() {
    return this.props.search
      .get('results', Immutable.List())
      .map((result) => this.findById(result.get('id')))
      .filter(result => result);
  }

  renderSearchResultsSidebar() {
    return (
      <TabLayoutSidebar key="tab-layout-sidebar-left">
        <SearchResultsSidebar
          key="search-results-sidebar"
          searchOptions={Immutable.fromJS(this.props.searchOptions)}
          onSearchFilterReset={() => this.onSearchFilterReset()}
          onSearchInputChange={(query) => this.onSearchInputChange(query, this.props.testMode)}
          filters={this.filters()}
          placeholder={this.props.searchPlaceholder}
          showSearch={!this.state.hideSearchBar}
        />
      </TabLayoutSidebar>
    );
  }

  render() {
    const records = this.records();
    const numRecords = records.count();
    const empty = !this.props.isSearching && numRecords == 0;
    return (
      <TabLayout
        className={Classnames('selector-content', this.props.className)}
        wideSidebar={this.props.wideSidebar}
        contextType={this.props.isDrawer ? 'drawer' : 'modal'}
      >
        <Choose>
          <When condition={this.state.isLoading}>
            <Spinner />
          </When>
          <Otherwise>
            {this.renderSearchResultsSidebar()}
            <div
              className={Classnames('selector-content__content', {
                'selector-content__content--is-drawer': this.props.isDrawer,
                'selector-content__content--data': !empty,
                'selector-content__content--empty': empty && !this.props.zeroStateProps
              })}
            >
              <Choose>
                <When condition={empty && this.props.testMode}>
                  <ZeroState title="No containers were found..." />
                </When>
                <When condition={empty && this.props.zeroStateProps}>
                  <ZeroState
                    {...this.props.zeroStateProps}
                  />
                </When>
                <Otherwise>
                  {this.searchResults(records)}
                </Otherwise>
              </Choose>
            </div>
          </Otherwise>
        </Choose>
      </TabLayout>
    );
  }
}

export default SelectorContent;
